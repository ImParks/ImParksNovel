import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AiRepository } from '../infrastructure/ai.repository';
import {
  ContinueWritingDto,
  ImproveTextDto,
  GenerateSettingDto,
  SuggestPlotDto,
} from './dto/ai.input';
import {
  AITokenBalanceObject,
  AITokenTransactionConnection,
  SettingNoteObject,
} from './dto/ai.object';
import { CreateSettingNoteInput, UpdateSettingNoteInput } from './dto/ai.input';
import { AIFeatureType, AITokenTransactionType } from '@prisma/client';
import {
  AIProviderPort,
  AI_PROVIDER_PORT,
  AIModelType,
} from '../domain/ports/ai-provider.port';
import { AiCoinService } from './ai-coin.service';

interface SSEEvent {
  event: string;
  data: unknown;
}

// ──────────────────────────────────────────────
// AI Service
// ──────────────────────────────────────────────

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_PORT) private readonly aiProvider: AIProviderPort,
    private readonly aiCoinService: AiCoinService,
  ) {}

  // ──────────────────────────────────────────────
  // Token Management
  // ──────────────────────────────────────────────

  /**
   * Get AI token balance for a user
   */
  async getAITokenBalance(userId: string): Promise<AITokenBalanceObject> {
    let wallet = await this.aiRepository.findWalletByUserId(userId);

    // 지갑이 없으면 생성
    if (!wallet) {
      wallet = await this.aiRepository.createWallet(userId);
    }

    return {
      balance: wallet.balance,
      totalCharged: wallet.totalCharged,
      totalUsed: wallet.totalUsed,
    };
  }

  /**
   * Get AI token transactions for a user (cursor pagination)
   */
  async getAITokenTransactions(
    userId: string,
    type?: AITokenTransactionType,
    first?: number,
    after?: string,
  ): Promise<AITokenTransactionConnection> {
    const limit = first ?? 20;

    const result = await this.aiRepository.findTransactionsByUserId(
      userId,
      type,
      limit + 1,
      after,
    );

    const hasNextPage = result.length > limit;
    const items = hasNextPage ? result.slice(0, limit) : result;

    return {
      edges: items.map((t) => ({
        node: {
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          description: t.description,
          createdAt: t.createdAt,
        },
        cursor: Buffer.from(t.id).toString('base64'),
      })),
      pageInfo: {
        hasNextPage,
        endCursor: items.length > 0 ? Buffer.from(items[items.length - 1].id).toString('base64') : undefined,
      },
      totalCount: items.length,
    };
  }

  /**
   * Internal helper: Increase tokens (charge from payment)
   */
  private async chargeTokens(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<void> {
    let wallet = await this.aiRepository.findWalletByUserId(userId);

    if (!wallet) {
      wallet = await this.aiRepository.createWallet(userId);
    }

    // 낙관적 잠금으로 동시성 제어
    const updatedWallet = await this.aiRepository.updateBalance(
      wallet.id,
      wallet.version,
      amount, // balanceChange
      amount, // totalChargedChange
      0, // totalUsedChange
    );

    // 트랜잭션 기록
    await this.aiRepository.createTransaction({
      walletId: updatedWallet.id,
      userId,
      type: AITokenTransactionType.CHARGE,
      amount,
      balanceAfter: updatedWallet.balance,
      description: description ?? '토큰 충전',
    });
  }

  /**
   * Internal helper: Decrease tokens (use for AI generation)
   * Returns the updated wallet for SSE response
   */
  private async useTokens(
    userId: string,
    tokensToUse: number,
    generationLogId?: string,
    description?: string,
  ): Promise<{ balance: number; totalUsed: number }> {
    let wallet = await this.aiRepository.findWalletByUserId(userId);

    if (!wallet) {
      throw new BadRequestException('AI 토큰 지갑을 찾을 수 없습니다.');
    }

    // 토큰 부족 확인
    if (wallet.balance < tokensToUse) {
      throw new BadRequestException('AI 토큰이 부족합니다.');
    }

    // 낙관적 잠금으로 차감
    const updatedWallet = await this.aiRepository.updateBalance(
      wallet.id,
      wallet.version,
      -tokensToUse, // balanceChange (음수)
      0, // totalChargedChange
      tokensToUse, // totalUsedChange (양수로 기록)
    );

    // 트랜잭션 기록
    await this.aiRepository.createTransaction({
      walletId: updatedWallet.id,
      userId,
      type: AITokenTransactionType.USE,
      amount: -tokensToUse,
      balanceAfter: updatedWallet.balance,
      generationLogId,
      description: description ?? 'AI 생성 사용',
    });

    return {
      balance: updatedWallet.balance,
      totalUsed: updatedWallet.totalUsed,
    };
  }

  // ──────────────────────────────────────────────
  // Setting Notes (설정 노트 관리)
  // ──────────────────────────────────────────────

  /**
   * Get setting notes for a novel (작가 권한 검증)
   */
  async getSettingNotes(
    userId: string,
    novelId: string,
    category?: string,
  ): Promise<SettingNoteObject[]> {
    // 소설 작가 본인 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException(
        '소설을 찾을 수 없거나 권한이 없습니다.',
      );
    }

    const settings = await this.aiRepository.findSettingsByNovelId(
      novelId,
      category,
    );

    return settings.map((s) => ({
      id: s.id,
      novelId: s.novelId,
      category: s.category,
      title: s.title,
      content: s.content,
      isAIGenerated: s.isAIGenerated,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Get a single setting note by ID
   */
  async getSettingNote(
    userId: string,
    settingId: string,
  ): Promise<SettingNoteObject | null> {
    const setting = await this.aiRepository.findSettingById(settingId);

    if (!setting) {
      return null;
    }

    // 소설 작가 권한 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: setting.novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException('권한이 없습니다.');
    }

    return {
      id: setting.id,
      novelId: setting.novelId,
      category: setting.category,
      title: setting.title,
      content: setting.content,
      isAIGenerated: setting.isAIGenerated,
      createdAt: setting.createdAt,
    };
  }

  /**
   * Create a new setting note
   */
  async createSettingNote(
    userId: string,
    input: CreateSettingNoteInput,
  ): Promise<SettingNoteObject> {
    // 소설 작가 권한 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: input.novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException(
        '소설을 찾을 수 없거나 권한이 없습니다.',
      );
    }

    const setting = await this.aiRepository.createSetting({
      novelId: input.novelId,
      category: input.category,
      title: input.title,
      content: input.content,
      isAIGenerated: false,
    });

    return {
      id: setting.id,
      novelId: setting.novelId,
      category: setting.category,
      title: setting.title,
      content: setting.content,
      isAIGenerated: setting.isAIGenerated,
      createdAt: setting.createdAt,
    };
  }

  /**
   * Update an existing setting note
   */
  async updateSettingNote(
    userId: string,
    settingId: string,
    input: UpdateSettingNoteInput,
  ): Promise<SettingNoteObject> {
    const setting = await this.aiRepository.findSettingById(settingId);

    if (!setting) {
      throw new NotFoundException('설정 노트를 찾을 수 없습니다.');
    }

    // 소설 작가 권한 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: setting.novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException('권한이 없습니다.');
    }

    const updated = await this.aiRepository.updateSetting(settingId, {
      category: input.category,
      title: input.title,
      content: input.content,
    });

    return {
      id: updated.id,
      novelId: updated.novelId,
      category: updated.category,
      title: updated.title,
      content: updated.content,
      isAIGenerated: updated.isAIGenerated,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Delete a setting note
   */
  async deleteSettingNote(userId: string, settingId: string): Promise<boolean> {
    const setting = await this.aiRepository.findSettingById(settingId);

    if (!setting) {
      throw new NotFoundException('설정 노트를 찾을 수 없습니다.');
    }

    // 소설 작가 권한 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: setting.novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException('권한이 없습니다.');
    }

    await this.aiRepository.deleteSetting(settingId);
    return true;
  }

  // ──────────────────────────────────────────────
  // AI Generation (SSE Streaming)
  // ──────────────────────────────────────────────

  /**
   * Generate continuation (AsyncGenerator for SSE streaming)
   * Calls OpenAI provider with configured prompts and settings
   */
  async *generateContinuation(
    userId: string,
    dto: ContinueWritingDto,
  ): AsyncGenerator<SSEEvent> {
    // 1. 코인 사전 차감
    const deduction = await this.aiCoinService.deductCoinsForAI(
      userId,
      'CONTINUE_WRITING',
    );

    try {
      // 2. 설정 노트 로드 (있으면)
      const settingNotes = dto.settingNoteIds
        ? await Promise.all(
            dto.settingNoteIds.map((id) =>
              this.aiRepository.findSettingById(id),
            ),
          )
        : [];

      const settingContext = settingNotes
        .filter((s) => s !== null)
        .map((s) => `[${s.category}] ${s.title}: ${s.content}`)
        .join('\n\n');

      // 3. 프롬프트 구성
      const systemPrompt = `당신은 한국어 웹소설 작가 보조 AI입니다.
주어진 소설의 문체와 톤을 유지하면서 자연스럽게 이어서 작성하세요.
${settingContext ? `\n설정 참고:\n${settingContext}` : ''}`;

      const userPrompt = `다음 내용을 이어서 작성해주세요 (최대 ${dto.maxTokens ?? 1000}토큰):\n\n${dto.context}\n\n${dto.prompt}`;

      // 4. OpenAI 호출
      const response = await this.aiProvider.generate({
        model: AIModelType.DEFAULT,
        systemPrompt,
        userPrompt,
        maxOutputTokens: dto.maxTokens ?? 1000,
        reasoning: 'none',
        verbosity: 'medium',
      });

      // 5. 생성 로그 기록
      const generationLog = await this.prisma.aIGenerationLog.create({
        data: {
          userId,
          novelId: dto.novelId,
          episodeId: dto.episodeId,
          featureType: AIFeatureType.CONTINUE_WRITING,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
          tokensCharged: deduction.amount,
          inputText: dto.context + '\n' + dto.prompt,
          outputText: response.text,
          charCount: response.text.length,
          modelId: response.modelId,
          wasAccepted: true,
          request: {
            novelId: dto.novelId,
            episodeId: dto.episodeId,
            maxTokens: dto.maxTokens ?? 1000,
            temperature: dto.temperature ?? 0.7,
            settingCount: settingNotes.length,
          },
        },
      });

      // 6. SSE 스트림 발행
      yield {
        event: 'token',
        data: {
          content: response.text,
          tokenCount: response.totalTokens,
        },
      };

      yield {
        event: 'done',
        data: {
          totalTokens: response.totalTokens,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          logId: generationLog.id,
          coinsUsed: deduction.amount,
        },
      };
    } catch (error) {
      // 7. 실패 시 코인 환불
      await this.aiCoinService.refundCoinsForAI(
        userId,
        deduction.amount,
        `CONTINUE_WRITING 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Improve text (AsyncGenerator for SSE streaming)
   */
  async *improveText(
    userId: string,
    dto: ImproveTextDto,
  ): AsyncGenerator<SSEEvent> {
    // 1. 코인 사전 차감
    const deduction = await this.aiCoinService.deductCoinsForAI(
      userId,
      'TEXT_IMPROVEMENT',
    );

    try {
      // 2. 프롬프트 구성
      const systemPrompt = `당신은 한국어 문장 교정 및 개선 전문가입니다.
다음 스타일로 텍스트를 개선해주세요:
스타일: ${dto.style}${
        dto.instructions
          ? `\n추가 지시사항:\n${dto.instructions}`
          : ''
      }

개선 시 다음을 유의하세요:
- 원본 의도를 훼손하지 않을 것
- 자연스러운 한국어 표현 사용
- 문맥에 맞는 어조 유지`;

      const userPrompt = `다음 텍스트를 개선해주세요:\n\n${dto.text}`;

      // 3. OpenAI 호출
      const response = await this.aiProvider.generate({
        model: AIModelType.ECONOMY,
        systemPrompt,
        userPrompt,
        maxOutputTokens: 500,
        reasoning: 'none',
        verbosity: 'low',
      });

      // 4. 로그 기록
      const generationLog = await this.prisma.aIGenerationLog.create({
        data: {
          userId,
          featureType: AIFeatureType.IMPROVE_SENTENCE,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
          tokensCharged: deduction.amount,
          inputText: dto.text,
          outputText: response.text,
          charCount: response.text.length,
          modelId: response.modelId,
          wasAccepted: true,
          request: {
            style: dto.style,
            instructions: dto.instructions,
          },
        },
      });

      // 5. SSE 스트림 발행
      yield {
        event: 'token',
        data: {
          content: response.text,
          tokenCount: response.totalTokens,
        },
      };

      yield {
        event: 'done',
        data: {
          totalTokens: response.totalTokens,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          logId: generationLog.id,
          coinsUsed: deduction.amount,
        },
      };
    } catch (error) {
      // 6. 실패 시 코인 환불
      await this.aiCoinService.refundCoinsForAI(
        userId,
        deduction.amount,
        `TEXT_IMPROVEMENT 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Generate setting (AsyncGenerator for SSE streaming)
   */
  async *generateSetting(
    userId: string,
    dto: GenerateSettingDto,
  ): AsyncGenerator<SSEEvent> {
    // 1. 권한 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: dto.novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException(
        '소설을 찾을 수 없거나 권한이 없습니다.',
      );
    }

    // 2. 코인 사전 차감
    const deduction = await this.aiCoinService.deductCoinsForAI(
      userId,
      'SETTING_GENERATION',
    );

    try {
      // 3. 기존 설정 로드
      const existingSettings = dto.existingSettingIds
        ? await Promise.all(
            dto.existingSettingIds.map((id) =>
              this.aiRepository.findSettingById(id),
            ),
          )
        : [];

      const existingContext = existingSettings
        .filter((s) => s !== null)
        .map((s) => `- [${s.category}] ${s.title}: ${s.content}`)
        .join('\n');

      // 4. 프롬프트 구성
      const settingTypeContext = this.getSettingTypeContext(dto.type);

      const systemPrompt = `당신은 한국어 웹소설 세계관 설정 전문가입니다.
생성할 설정 유형: ${dto.type}

${settingTypeContext}

${
        existingContext
          ? `\n기존 설정 (참고):\n${existingContext}`
          : ''
      }

다음을 유의하세요:
- 일관성 있고 흥미로운 설정 생성
- 웹소설 장르에 적합한 표현
- 구체적이고 실용적인 내용`;

      const userPrompt = `다음 요청에 맞는 ${dto.type} 설정을 생성해주세요:\n\n${dto.prompt}`;

      // 5. OpenAI 호출
      const response = await this.aiProvider.generate({
        model: AIModelType.DEFAULT,
        systemPrompt,
        userPrompt,
        maxOutputTokens: 800,
        reasoning: 'none',
        verbosity: 'high',
      });

      // 6. 로그 기록
      const generationLog = await this.prisma.aIGenerationLog.create({
        data: {
          userId,
          novelId: dto.novelId,
          featureType: AIFeatureType.GENERATE_SETTING,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
          tokensCharged: deduction.amount,
          inputText: dto.prompt,
          outputText: response.text,
          charCount: response.text.length,
          modelId: response.modelId,
          wasAccepted: true,
          request: {
            type: dto.type,
            existingSettingCount: existingSettings.length,
          },
        },
      });

      // 7. SSE 스트림 발행
      yield {
        event: 'token',
        data: {
          content: response.text,
          tokenCount: response.totalTokens,
        },
      };

      yield {
        event: 'done',
        data: {
          totalTokens: response.totalTokens,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          logId: generationLog.id,
          coinsUsed: deduction.amount,
        },
      };
    } catch (error) {
      // 8. 실패 시 코인 환불
      await this.aiCoinService.refundCoinsForAI(
        userId,
        deduction.amount,
        `SETTING_GENERATION 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get context description for setting type
   */
  private getSettingTypeContext(type: string): string {
    const contexts: Record<string, string> = {
      character:
        '인물 설정: 이름, 나이, 성격, 능력, 과거 이력, 대사체 등을 포함하는 상세한 캐릭터 프로필',
      worldbuilding:
        '세계관: 시대, 지역, 문화, 기술 수준, 정치 체계, 역사 등을 포함하는 종합 배경',
      magic_system:
        '마법 체계: 마법의 원리, 규칙, 제한사항, 등급체계, 수행 방식 등의 세부 설정',
      power_system:
        '능력 체계: 무공, 초능력, 기술 등 등급, 수련법, 한계 등을 명시한 체계',
      faction:
        '세력/조직: 세력명, 본거지, 세력의 성향, 주요 인물, 이념, 기술 등의 상세 설명',
      location:
        '장소: 이름, 위치, 특징, 역사, 주요 세력, 중요도 등을 포함한 지역 설정',
      item: '아이템/도구: 이름, 능력, 획득 방법, 제한사항, 역사적 의의 등을 명시한 설정',
    };
    return (
      contexts[type.toLowerCase()] ||
      '설정: 자세하고 일관성 있는 설정 생성'
    );
  }

  /**
   * Suggest plot (AsyncGenerator for SSE streaming)
   */
  async *suggestPlot(
    userId: string,
    dto: SuggestPlotDto,
  ): AsyncGenerator<SSEEvent> {
    // 1. 권한 확인
    const novel = await this.prisma.novel.findFirst({
      where: { id: dto.novelId, authorId: userId },
    });

    if (!novel) {
      throw new NotFoundException(
        '소설을 찾을 수 없거나 권한이 없습니다.',
      );
    }

    // 2. 코인 사전 차감
    const deduction = await this.aiCoinService.deductCoinsForAI(
      userId,
      'PLOT_SUGGESTION',
    );

    try {
      // 3. 설정 노트 로드
      const settingNotes = dto.settingNoteIds
        ? await Promise.all(
            dto.settingNoteIds.map((id) =>
              this.aiRepository.findSettingById(id),
            ),
          )
        : [];

      const settingContext = settingNotes
        .filter((s) => s !== null)
        .map((s) => `[${s.category}] ${s.title}: ${s.content}`)
        .join('\n\n');

      // 4. 프롬프트 구성
      const directionGuidance = this.getPlotDirectionGuidance(dto.direction ?? 'escalation');

      const systemPrompt = `당신은 한국어 웹소설 플롯 전개 전문가입니다.
현재 플롯을 분석하고, 흥미로운 전개 방향을 제안해주세요.

플롯 전개 방향: ${dto.direction}
${directionGuidance}

${
        settingContext
          ? `\n참고할 세계관 설정:\n${settingContext}`
          : ''
      }

제안 시 다음을 유의하세요:
- 현재 서사 흐름과 자연스럽게 연결될 것
- 장르와 독자 취향을 고려할 것
- 구체적이고 실행 가능한 제안
- 갈등과 반전의 요소 포함`;

      const userPrompt = `현재 플롯:\n${dto.currentPlot}\n\n플롯 전개 제안을 해주세요.`;

      // 5. OpenAI 호출
      const response = await this.aiProvider.generate({
        model: AIModelType.DEFAULT,
        systemPrompt,
        userPrompt,
        maxOutputTokens: 1000,
        reasoning: 'low',
        verbosity: 'high',
      });

      // 6. 로그 기록
      const generationLog = await this.prisma.aIGenerationLog.create({
        data: {
          userId,
          novelId: dto.novelId,
          featureType: AIFeatureType.SUGGEST_PLOT,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
          tokensCharged: deduction.amount,
          inputText: dto.currentPlot,
          outputText: response.text,
          charCount: response.text.length,
          modelId: response.modelId,
          wasAccepted: true,
          request: {
            direction: dto.direction,
            settingCount: settingNotes.length,
          },
        },
      });

      // 7. SSE 스트림 발행
      yield {
        event: 'token',
        data: {
          content: response.text,
          tokenCount: response.totalTokens,
        },
      };

      yield {
        event: 'done',
        data: {
          totalTokens: response.totalTokens,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          logId: generationLog.id,
          coinsUsed: deduction.amount,
        },
      };
    } catch (error) {
      // 8. 실패 시 코인 환불
      await this.aiCoinService.refundCoinsForAI(
        userId,
        deduction.amount,
        `PLOT_SUGGESTION 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get guidance for plot direction
   */
  private getPlotDirectionGuidance(direction: string): string {
    const guidance: Record<string, string> = {
      escalation:
        '현재보다 높은 긴장감과 충돌로 나아가는 방향. 갈등을 심화시키고 이야기를 가속화',
      twist: '독자의 예상을 벗어나는 반전. 새로운 정보 공개, 인물의 비밀, 상황의 역전',
      climax:
        '이야기의 절정. 모든 갈등이 최고조에 달하고 주인공이 큰 결정을 내리는 순간',
      resolution:
        '갈등의 해결. 문제가 풀리고 등장인물들이 변화를 겪는 과정',
      subplot:
        '부플롯 추가. 주플롯과 조화를 이루면서 깊이를 더하는 새로운 이야기 선',
      character_development:
        '캐릭터의 성장과 변화. 인물의 심리적 변화, 관계의 발전, 새로운 능력 습득',
      worldbuilding_expansion:
        '세계관 확장. 새로운 지역, 세력, 규칙 소개로 이야기의 스케일 확대',
    };
    return (
      guidance[direction.toLowerCase()] ||
      '자연스럽고 흥미로운 플롯 전개'
    );
  }
}
