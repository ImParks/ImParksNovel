import {
  Injectable,
  BadRequestException,
  NotFoundException,
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
   * 스텁 구현: 실제 OpenAI/Anthropic 호출은 Phase 2에서 추가
   */
  async *generateContinuation(
    userId: string,
    dto: ContinueWritingDto,
  ): AsyncGenerator<SSEEvent> {
    // 1. 토큰 잔액 확인
    const wallet = await this.aiRepository.findWalletByUserId(userId);
    if (!wallet || wallet.balance < 10) {
      throw new BadRequestException('AI 토큰이 부족합니다.');
    }

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

    // 3. AI 호출 (스텁 - Mock 응답)
    const tokensUsed = 10;
    const mockContent = `[AI 이어쓰기 결과]\n${dto.prompt}에 이어서 생성된 내용입니다.\n\n이것은 스텁 구현이며, 실제 AI API는 Phase 2에서 통합됩니다.`;

    // 4. 생성 로그 기록 (트랜잭션 사용)
    const generationLog = await this.prisma.aIGenerationLog.create({
      data: {
        userId,
        novelId: dto.novelId,
        episodeId: dto.episodeId,
        featureType: AIFeatureType.CONTINUE_WRITING,
        inputTokens: 0, // Phase 2에서 실제 토큰 수 계산
        outputTokens: 0,
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        inputText: dto.context + '\n' + dto.prompt,
        outputText: mockContent,
        charCount: mockContent.length,
        modelId: 'gpt-4o-mini', // 스텁
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

    // SSE 스트림 발행
    yield {
      event: 'token',
      data: {
        content: mockContent,
        tokenCount: tokensUsed,
      },
    };

    // 5. 토큰 차감
    const remaining = await this.useTokens(
      userId,
      tokensUsed,
      generationLog.id,
      `이어쓰기: ${dto.novelId}`,
    );

    yield {
      event: 'done',
      data: {
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        remainingTokens: remaining.balance,
        generationLogId: generationLog.id,
      },
    };
  }

  /**
   * Improve text (AsyncGenerator for SSE streaming)
   */
  async *improveText(
    userId: string,
    dto: ImproveTextDto,
  ): AsyncGenerator<SSEEvent> {
    // 1. 토큰 확인
    const wallet = await this.aiRepository.findWalletByUserId(userId);
    if (!wallet || wallet.balance < 5) {
      throw new BadRequestException('AI 토큰이 부족합니다.');
    }

    // 2. AI 호출 (스텁)
    const tokensUsed = 5;
    const mockContent = `[${dto.style} 스타일로 개선됨]\n${dto.text}\n\n이것은 스텁 구현입니다.`;

    // 3. 로그 기록
    const generationLog = await this.prisma.aIGenerationLog.create({
      data: {
        userId,
        featureType: AIFeatureType.IMPROVE_SENTENCE,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        inputText: dto.text,
        outputText: mockContent,
        charCount: mockContent.length,
        modelId: 'gpt-4o-mini',
        wasAccepted: true,
        request: {
          style: dto.style,
          instructions: dto.instructions,
        },
      },
    });

    yield {
      event: 'token',
      data: {
        content: mockContent,
        tokenCount: tokensUsed,
      },
    };

    const remaining = await this.useTokens(
      userId,
      tokensUsed,
      generationLog.id,
      `텍스트 개선: ${dto.style}`,
    );

    yield {
      event: 'done',
      data: {
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        remainingTokens: remaining.balance,
        generationLogId: generationLog.id,
      },
    };
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

    // 2. 토큰 확인
    const wallet = await this.aiRepository.findWalletByUserId(userId);
    if (!wallet || wallet.balance < 15) {
      throw new BadRequestException('AI 토큰이 부족합니다.');
    }

    // 3. 기존 설정 로드
    const existingSettings = dto.existingSettingIds
      ? await Promise.all(
          dto.existingSettingIds.map((id) =>
            this.aiRepository.findSettingById(id),
          ),
        )
      : [];

    // 4. AI 호출 (스텁)
    const tokensUsed = 15;
    const mockContent = `[${dto.type} 설정 생성]\n${dto.prompt}\n\n이것은 스텁 구현입니다.`;

    // 5. 로그 기록
    const generationLog = await this.prisma.aIGenerationLog.create({
      data: {
        userId,
        novelId: dto.novelId,
        featureType: AIFeatureType.GENERATE_SETTING,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        inputText: dto.prompt,
        outputText: mockContent,
        charCount: mockContent.length,
        modelId: 'gpt-4o-mini',
        wasAccepted: true,
        request: {
          type: dto.type,
          existingSettingCount: existingSettings.length,
        },
      },
    });

    yield {
      event: 'token',
      data: {
        content: mockContent,
        tokenCount: tokensUsed,
      },
    };

    const remaining = await this.useTokens(
      userId,
      tokensUsed,
      generationLog.id,
      `설정 생성: ${dto.type}`,
    );

    yield {
      event: 'done',
      data: {
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        remainingTokens: remaining.balance,
        generationLogId: generationLog.id,
      },
    };
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

    // 2. 토큰 확인
    const wallet = await this.aiRepository.findWalletByUserId(userId);
    if (!wallet || wallet.balance < 12) {
      throw new BadRequestException('AI 토큰이 부족합니다.');
    }

    // 3. 설정 노트 로드
    const settingNotes = dto.settingNoteIds
      ? await Promise.all(
          dto.settingNoteIds.map((id) =>
            this.aiRepository.findSettingById(id),
          ),
        )
      : [];

    // 4. AI 호출 (스텁)
    const tokensUsed = 12;
    const mockContent = `[플롯 제안]\n${dto.currentPlot}에 대한 플롯 제안입니다.\n\n이것은 스텁 구현입니다.`;

    // 5. 로그 기록
    const generationLog = await this.prisma.aIGenerationLog.create({
      data: {
        userId,
        novelId: dto.novelId,
        featureType: AIFeatureType.SUGGEST_PLOT,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        inputText: dto.currentPlot,
        outputText: mockContent,
        charCount: mockContent.length,
        modelId: 'gpt-4o-mini',
        wasAccepted: true,
        request: {
          direction: dto.direction,
          settingCount: settingNotes.length,
        },
      },
    });

    yield {
      event: 'token',
      data: {
        content: mockContent,
        tokenCount: tokensUsed,
      },
    };

    const remaining = await this.useTokens(
      userId,
      tokensUsed,
      generationLog.id,
      `플롯 제안: ${dto.novelId}`,
    );

    yield {
      event: 'done',
      data: {
        totalTokens: tokensUsed,
        tokensCharged: tokensUsed,
        remainingTokens: remaining.balance,
        generationLogId: generationLog.id,
      },
    };
  }
}
