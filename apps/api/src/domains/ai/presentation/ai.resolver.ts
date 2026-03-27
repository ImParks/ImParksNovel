import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../../common/types/context';
import { AiService } from '../application/ai.service';
import { EpisodePlanService } from '../application/episode-plan.service';
import { CreateSettingNoteInput, UpdateSettingNoteInput, SuggestEpisodeDivisionInput } from '../application/dto/ai.input';
import {
  AITokenBalanceObject,
  AITokenTransactionConnection,
  SettingNoteObject,
  EpisodePlanObject,
} from '../application/dto/ai.object';
import { AITokenTransactionType } from '@prisma/client';

// ──────────────────────────────────────────────
// AI Resolver (GraphQL)
// ──────────────────────────────────────────────

@Resolver()
export class AiResolver {
  constructor(
    private readonly aiService: AiService,
    private readonly episodePlanService: EpisodePlanService,
  ) {}

  // ──────────────────────────────────────────────
  // Token Queries
  // ──────────────────────────────────────────────

  /**
   * Query: aiTokenBalance
   * Get the current AI token balance for the authenticated user
   */
  @Query(() => AITokenBalanceObject)
  @UseGuards(JwtAuthGuard)
  async aiTokenBalance(
    @CurrentUser() user: JwtPayload,
  ): Promise<AITokenBalanceObject> {
    return this.aiService.getAITokenBalance(user.userId);
  }

  /**
   * Query: aiTokenTransactions
   * Get the list of AI token transactions (cursor pagination)
   */
  @Query(() => AITokenTransactionConnection)
  @UseGuards(JwtAuthGuard)
  async aiTokenTransactions(
    @CurrentUser() user: JwtPayload,
    @Args('type', { type: () => AITokenTransactionType, nullable: true })
    type?: AITokenTransactionType,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 })
    first?: number,
    @Args('after', { nullable: true })
    after?: string,
  ): Promise<AITokenTransactionConnection> {
    return this.aiService.getAITokenTransactions(user.userId, type, first, after);
  }

  // ──────────────────────────────────────────────
  // Setting Note Queries
  // ──────────────────────────────────────────────

  /**
   * Query: settingNotes
   * Get all setting notes for a novel (requires author permission)
   */
  @Query(() => [SettingNoteObject])
  @UseGuards(JwtAuthGuard)
  async settingNotes(
    @CurrentUser() user: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
    @Args('category', { nullable: true }) category?: string,
  ): Promise<SettingNoteObject[]> {
    return this.aiService.getSettingNotes(user.userId, novelId, category);
  }

  /**
   * Query: settingNote
   * Get a single setting note by ID
   */
  @Query(() => SettingNoteObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async settingNote(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SettingNoteObject | null> {
    return this.aiService.getSettingNote(user.userId, id);
  }

  // ──────────────────────────────────────────────
  // Setting Note Mutations
  // ──────────────────────────────────────────────

  /**
   * Mutation: createSettingNote
   * Create a new setting note for a novel
   */
  @Mutation(() => SettingNoteObject)
  @UseGuards(JwtAuthGuard)
  async createSettingNote(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateSettingNoteInput,
  ): Promise<SettingNoteObject> {
    return this.aiService.createSettingNote(user.userId, input);
  }

  /**
   * Mutation: updateSettingNote
   * Update an existing setting note
   */
  @Mutation(() => SettingNoteObject)
  @UseGuards(JwtAuthGuard)
  async updateSettingNote(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSettingNoteInput,
  ): Promise<SettingNoteObject> {
    return this.aiService.updateSettingNote(user.userId, id, input);
  }

  /**
   * Mutation: deleteSettingNote
   * Delete a setting note
   */
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteSettingNote(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.aiService.deleteSettingNote(user.userId, id);
  }

  // ──────────────────────────────────────────────
  // Episode Plan Queries
  // ──────────────────────────────────────────────

  /**
   * Query: episodePlans
   * Get all episode division plans for a novel
   */
  @Query(() => [EpisodePlanObject])
  @UseGuards(JwtAuthGuard)
  async episodePlans(
    @CurrentUser() user: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
  ): Promise<any[]> {
    return this.episodePlanService.getPlans(user.userId, novelId);
  }

  /**
   * Query: episodePlan
   * Get a single episode division plan by ID
   */
  @Query(() => EpisodePlanObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async episodePlan(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<any | null> {
    return this.episodePlanService.getPlan(user.userId, id);
  }

  // ──────────────────────────────────────────────
  // Episode Plan Mutations
  // ──────────────────────────────────────────────

  /**
   * Mutation: suggestEpisodeDivision
   * Generate episode division suggestions from a plot summary (5 tokens)
   */
  @Mutation(() => EpisodePlanObject)
  @UseGuards(JwtAuthGuard)
  async suggestEpisodeDivision(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: SuggestEpisodeDivisionInput,
  ): Promise<any> {
    return this.episodePlanService.suggestEpisodeDivision(user.userId, input);
  }
}
