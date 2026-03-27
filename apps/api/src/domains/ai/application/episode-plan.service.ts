import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  AIProviderPort,
  AI_PROVIDER_PORT,
  AIModelType,
} from '../domain/ports/ai-provider.port';
import { AiCoinService } from './ai-coin.service';
import { AiRepository } from '../infrastructure/ai.repository';
import { AIFeatureType } from '@prisma/client';

// ──────────────────────────────────────────────
// Type Definitions
// ──────────────────────────────────────────────

export interface EpisodePlanItem {
  number: number;
  title: string;
  synopsis: string;
  mainCharacters: string[];
  keyEvents: string[];
  mood: string;
  cliffhanger?: string;
  estimatedLength: number;
}

export interface EpisodePlanResponse {
  totalEpisodes: number;
  episodes: EpisodePlanItem[];
}

export interface SuggestDivisionInput {
  novelId: string;
  plotSummary: string;
  targetCharsPerEpisode?: number;
  genre?: string;
}

// ──────────────────────────────────────────────
// Episode Plan Service
// ──────────────────────────────────────────────

@Injectable()
export class EpisodePlanService {
  // AI 토큰 가격 (회차 분할): 5 토큰
  private readonly EPISODE_DIVISION_COST = 5;

  constructor(
    @Inject(AI_PROVIDER_PORT) private aiProvider: AIProviderPort,
    private aiCoinService: AiCoinService,
    private aiRepository: AiRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * 줄거리 → 회차 분할 제안 (5 토큰)
   * AI로 입력된 줄거리를 여러 회차로 분할하고 각 회차별 플랜을 제시한다.
   */
  async suggestEpisodeDivision(
    userId: string,
    input: SuggestDivisionInput,
  ): Promise<{ id: string; novelId: string; totalEpisodes: number; episodes: EpisodePlanItem[] }> {
    // 소설 존재 확인
    const novel = await this.prisma.novel.findUnique({
      where: { id: input.novelId },
    });

    if (!novel) {
      throw new NotFoundException(`Novel ${input.novelId} not found`);
    }

    // 권한 확인: 작가 본인만 가능
    if (novel.authorId !== userId) {
      throw new BadRequestException('Only the novel author can suggest episode divisions');
    }

    // 토큰 검증 (충분한지 확인)
    await this.aiCoinService.validateTokenBalance(userId, this.EPISODE_DIVISION_COST);

    // AI 프롬프트 구성
    const targetChars = input.targetCharsPerEpisode ?? 4000;
    const systemPrompt = '당신은 웹소설 편집자입니다. 줄거리를 회차로 분할하세요.';
    const userPrompt = this.buildEpisodeDivisionPrompt(
      input.plotSummary,
      targetChars,
      input.genre,
    );

    // AI 호출
    let aiResponse: string;
    try {
      const result = await this.aiProvider.generate({
        model: AIModelType.DEFAULT,
        systemPrompt,
        userPrompt,
        maxOutputTokens: 4000,
        reasoning: 'low',
        verbosity: 'medium',
      });
      aiResponse = result.text;
    } catch (err: any) {
      throw new BadRequestException(`AI provider error: ${err?.message || 'Unknown'}`);
    }

    // JSON 파싱
    let parsedResponse: EpisodePlanResponse;
    try {
      parsedResponse = this.parseEpisodePlanResponse(aiResponse);
    } catch (err: any) {
      throw new BadRequestException(`Failed to parse AI response: ${err?.message || 'Unknown'}`);
    }

    // 토큰 차감
    const generationLog = await this.aiRepository.createGenerationLog({
      userId,
      novelId: input.novelId,
      featureType: AIFeatureType.SUGGEST_EPISODE_DIVISION,
      inputTokens: 0, // 실제로는 토큰 계산 필요
      outputTokens: 0,
      totalTokens: 0,
      tokensCharged: this.EPISODE_DIVISION_COST,
      inputText: input.plotSummary,
      outputText: aiResponse,
      charCount: input.plotSummary.length,
    });

    await this.aiCoinService.deductTokens(userId, this.EPISODE_DIVISION_COST);

    // EpisodePlan 저장
    const episodePlan = await this.prisma.episodePlan.create({
      data: {
        novelId: input.novelId,
        userId,
        sourceText: input.plotSummary,
        totalEpisodes: parsedResponse.totalEpisodes,
        episodes: parsedResponse.episodes as any,
        aiGenerationLogId: generationLog.id,
      },
    });

    return {
      id: episodePlan.id,
      novelId: episodePlan.novelId,
      totalEpisodes: episodePlan.totalEpisodes,
      episodes: episodePlan.episodes as unknown as EpisodePlanItem[],
    };
  }

  /**
   * 플랜 목록 조회
   */
  async getPlans(
    userId: string,
    novelId: string,
  ): Promise<Array<{ id: string; novelId: string; totalEpisodes: number; episodes: EpisodePlanItem[]; createdAt: Date }>> {
    // 소설 존재 확인 및 권한 확인
    const novel = await this.prisma.novel.findUnique({
      where: { id: novelId },
    });

    if (!novel) {
      throw new NotFoundException(`Novel ${novelId} not found`);
    }

    if (novel.authorId !== userId) {
      throw new BadRequestException('Only the novel author can view episode plans');
    }

    const plans = await this.prisma.episodePlan.findMany({
      where: { novelId },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      novelId: plan.novelId,
      totalEpisodes: plan.totalEpisodes,
      episodes: plan.episodes as unknown as EpisodePlanItem[],
      createdAt: plan.createdAt,
    }));
  }

  /**
   * 특정 플랜 조회
   */
  async getPlan(
    userId: string,
    planId: string,
  ): Promise<{ id: string; novelId: string; totalEpisodes: number; episodes: EpisodePlanItem[] } | null> {
    const plan = await this.prisma.episodePlan.findUnique({
      where: { id: planId },
      include: { novel: true },
    });

    if (!plan) {
      return null;
    }

    // 권한 확인
    if (plan.novel.authorId !== userId) {
      throw new BadRequestException('You do not have permission to view this plan');
    }

    return {
      id: plan.id,
      novelId: plan.novelId,
      totalEpisodes: plan.totalEpisodes,
      episodes: plan.episodes as unknown as EpisodePlanItem[],
    };
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private buildEpisodeDivisionPrompt(
    plotSummary: string,
    targetCharsPerEpisode: number,
    genre?: string,
  ): string {
    return `
줄거리: ${plotSummary}
${genre ? `장르: ${genre}` : ''}
1회차당 약 ${targetCharsPerEpisode}자 기준

각 회차별로 다음 정보를 JSON으로 제공하세요:
{
  "totalEpisodes": 숫자,
  "episodes": [{
    "number": 1,
    "title": "제목",
    "synopsis": "200자 내외 요약",
    "mainCharacters": ["캐릭터1", "캐릭터2"],
    "keyEvents": ["사건1", "사건2"],
    "mood": "긴장감/로맨틱/미스터리 등",
    "cliffhanger": "마지막 훅 (선택)",
    "estimatedLength": 4000
  }]
}

JSON만 반환하세요. 다른 설명은 하지 마세요.
`;
  }

  private parseEpisodePlanResponse(aiResponse: string): EpisodePlanResponse {
    // JSON 추출 (```json ... ``` 또는 그냥 JSON 형식)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                      aiResponse.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const jsonStr = jsonMatch[1];
    const parsed = JSON.parse(jsonStr);

    // 필수 필드 검증
    if (!parsed.totalEpisodes || !Array.isArray(parsed.episodes)) {
      throw new Error('Invalid response structure: missing totalEpisodes or episodes');
    }

    // 각 에피소드 검증
    parsed.episodes.forEach((ep: any, index: number) => {
      if (
        !ep.number ||
        !ep.title ||
        !ep.synopsis ||
        !Array.isArray(ep.mainCharacters) ||
        !Array.isArray(ep.keyEvents) ||
        !ep.mood ||
        !ep.estimatedLength
      ) {
        throw new Error(`Episode ${index} missing required fields`);
      }
    });

    return parsed as EpisodePlanResponse;
  }
}
