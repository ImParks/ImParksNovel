import { UseGuards } from '@nestjs/common';
import { Args, Context, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EpisodeStatus, NovelStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtPayload } from '../../../common/types/context';
import { NovelService } from '../application/novel.service';
import {
  CreateEpisodeInput,
  CreateNovelInput,
  ReadingProgressInput,
  SaveDraftInput,
  SerializationScheduleInput,
  UpdateEpisodeInput,
  UpdateNovelInput,
} from '../application/dto/novel.input';
import {
  DraftObject,
  EpisodeConnection,
  EpisodeObject,
  NovelConnection,
  NovelDetailObject,
  NovelObject,
  ReadingProgressObject,
  SerializationScheduleObject,
} from '../application/dto/novel.object';

@Resolver()
export class NovelResolver {
  constructor(private readonly novelService: NovelService) {}

  // ──────────────────────────────────────────────
  // Queries
  // ──────────────────────────────────────────────

  @Query(() => NovelObject, { nullable: true, name: 'novel' })
  async getNovel(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NovelObject | null> {
    return this.novelService.getNovel(id);
  }

  @Query(() => NovelDetailObject, { name: 'novelDetail' })
  async getNovelDetail(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NovelDetailObject> {
    return this.novelService.getNovelDetail(id);
  }

  @Query(() => NovelConnection, { name: 'myNovels' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMyNovels(
    @CurrentUser() currentUser: JwtPayload,
    @Args('status', { type: () => NovelStatus, nullable: true }) status?: NovelStatus,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<NovelConnection> {
    return this.novelService.getMyNovels(currentUser.userId, status, first, after);
  }

  @Query(() => EpisodeConnection, { name: 'episodes' })
  async getEpisodes(
    @Args('novelId', { type: () => ID }) novelId: string,
    @Args('status', { type: () => EpisodeStatus, nullable: true }) status?: EpisodeStatus,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<EpisodeConnection> {
    return this.novelService.getEpisodes(novelId, status, first, after);
  }

  @Query(() => EpisodeObject, { nullable: true, name: 'episode' })
  async getEpisode(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ): Promise<EpisodeObject | null> {
    const userId = context.req?.user?.userId;
    return this.novelService.getEpisode(id, userId);
  }

  @Query(() => ReadingProgressObject, { nullable: true, name: 'readingProgress' })
  @UseGuards(JwtAuthGuard)
  async getReadingProgress(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
  ): Promise<ReadingProgressObject | null> {
    return this.novelService.getReadingProgress(currentUser.userId, novelId);
  }

  @Query(() => [DraftObject], { name: 'drafts' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDrafts(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID, nullable: true }) novelId?: string,
  ): Promise<DraftObject[]> {
    return this.novelService.getDrafts(currentUser.userId, novelId);
  }

  // ──────────────────────────────────────────────
  // Novel mutations
  // ──────────────────────────────────────────────

  @Mutation(() => NovelObject, { name: 'createNovel' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createNovel(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: CreateNovelInput,
  ): Promise<NovelObject> {
    return this.novelService.createNovel(currentUser.userId, input);
  }

  @Mutation(() => NovelObject, { name: 'updateNovel' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateNovel(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateNovelInput,
  ): Promise<NovelObject> {
    return this.novelService.updateNovel(currentUser.userId, id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteNovel' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteNovel(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.novelService.deleteNovel(currentUser.userId, id);
  }

  @Mutation(() => NovelObject, { name: 'updateNovelStatus' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateNovelStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => NovelStatus }) status: NovelStatus,
  ): Promise<NovelObject> {
    return this.novelService.updateNovelStatus(currentUser.userId, id, status);
  }

  @Mutation(() => SerializationScheduleObject, { name: 'updateSerializationSchedule' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSerializationSchedule(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
    @Args('input') input: SerializationScheduleInput,
  ): Promise<SerializationScheduleObject> {
    return this.novelService.updateSerializationSchedule(currentUser.userId, novelId, input);
  }

  // ──────────────────────────────────────────────
  // Episode mutations
  // ──────────────────────────────────────────────

  @Mutation(() => EpisodeObject, { name: 'createEpisode' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createEpisode(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: CreateEpisodeInput,
  ): Promise<EpisodeObject> {
    return this.novelService.createEpisode(currentUser.userId, input);
  }

  @Mutation(() => EpisodeObject, { name: 'updateEpisode' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateEpisode(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEpisodeInput,
  ): Promise<EpisodeObject> {
    return this.novelService.updateEpisode(currentUser.userId, id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteEpisode' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteEpisode(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.novelService.deleteEpisode(currentUser.userId, id);
  }

  @Mutation(() => EpisodeObject, { name: 'publishEpisode' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async publishEpisode(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EpisodeObject> {
    return this.novelService.publishEpisode(currentUser.userId, id);
  }

  @Mutation(() => EpisodeObject, { name: 'scheduleEpisode' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async scheduleEpisode(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('scheduledAt') scheduledAt: Date,
  ): Promise<EpisodeObject> {
    return this.novelService.scheduleEpisode(currentUser.userId, id, scheduledAt);
  }

  @Mutation(() => EpisodeObject, { name: 'cancelSchedule' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelSchedule(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EpisodeObject> {
    return this.novelService.cancelSchedule(currentUser.userId, id);
  }

  // ──────────────────────────────────────────────
  // Draft mutations
  // ──────────────────────────────────────────────

  @Mutation(() => DraftObject, { name: 'saveDraft' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async saveDraft(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: SaveDraftInput,
  ): Promise<DraftObject> {
    return this.novelService.saveDraft(currentUser.userId, input);
  }

  @Mutation(() => DraftObject, { name: 'autoSaveDraft' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async autoSaveDraft(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: SaveDraftInput,
  ): Promise<DraftObject> {
    return this.novelService.autoSaveDraft(currentUser.userId, input);
  }

  // ──────────────────────────────────────────────
  // Reading progress mutation
  // ──────────────────────────────────────────────

  @Mutation(() => ReadingProgressObject, { name: 'saveReadingProgress' })
  @UseGuards(JwtAuthGuard)
  async saveReadingProgress(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: ReadingProgressInput,
  ): Promise<ReadingProgressObject> {
    return this.novelService.saveReadingProgress(currentUser.userId, input);
  }
}
