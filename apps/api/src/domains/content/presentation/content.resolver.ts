import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DislikeTargetType, LikeTargetType } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../../common/types/context';
import { ContentService } from '../application/content.service';
import {
  CommentOrderBy,
  CreateCommentInput,
  CreateReplyInput,
  ReportInput,
} from '../application/dto/content.input';
import {
  BookmarkConnection,
  BookmarkResult,
  CommentConnection,
  CommentObject,
  DislikeResult,
  FavoriteConnection,
  FavoriteResult,
  LikeResult,
  ReadingHistoryConnection,
  ReportObject,
} from '../application/dto/content.object';

@Resolver()
export class ContentResolver {
  constructor(private readonly contentService: ContentService) {}

  // ──────────────────────────────────────────────
  // Queries - 공개
  // ──────────────────────────────────────────────

  @Query(() => CommentConnection)
  async comments(
    @Args('episodeId', { type: () => ID }) episodeId: string,
    @Args('orderBy', { type: () => CommentOrderBy, nullable: true })
    orderBy?: CommentOrderBy,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<CommentConnection> {
    return this.contentService.getComments(episodeId, orderBy, { first, after });
  }

  // ──────────────────────────────────────────────
  // Queries - 인증 필요
  // ──────────────────────────────────────────────

  @Query(() => BookmarkConnection)
  @UseGuards(JwtAuthGuard)
  async myBookmarks(
    @CurrentUser() currentUser: JwtPayload,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<BookmarkConnection> {
    return this.contentService.getMyBookmarks(currentUser.userId, { first, after });
  }

  @Query(() => FavoriteConnection)
  @UseGuards(JwtAuthGuard)
  async myFavorites(
    @CurrentUser() currentUser: JwtPayload,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<FavoriteConnection> {
    return this.contentService.getMyFavorites(currentUser.userId, { first, after });
  }

  @Query(() => ReadingHistoryConnection)
  @UseGuards(JwtAuthGuard)
  async recentReads(
    @CurrentUser() currentUser: JwtPayload,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<ReadingHistoryConnection> {
    return this.contentService.getRecentReads(currentUser.userId, { first, after });
  }

  @Query(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async isBookmarked(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
  ): Promise<boolean> {
    return this.contentService.isBookmarked(currentUser.userId, novelId);
  }

  @Query(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async isFavorited(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
  ): Promise<boolean> {
    return this.contentService.isFavorited(currentUser.userId, novelId);
  }

  @Query(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async isLiked(
    @CurrentUser() currentUser: JwtPayload,
    @Args('targetType', { type: () => LikeTargetType }) targetType: LikeTargetType,
    @Args('targetId', { type: () => ID }) targetId: string,
  ): Promise<boolean> {
    return this.contentService.isLiked(currentUser.userId, targetType, targetId);
  }

  // ──────────────────────────────────────────────
  // Mutations - 모두 인증 필요
  // ──────────────────────────────────────────────

  @Mutation(() => CommentObject)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: CreateCommentInput,
  ): Promise<CommentObject> {
    return this.contentService.createComment(currentUser.userId, input);
  }

  @Mutation(() => CommentObject)
  @UseGuards(JwtAuthGuard)
  async createReply(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: CreateReplyInput,
  ): Promise<CommentObject> {
    return this.contentService.createReply(currentUser.userId, input);
  }

  @Mutation(() => CommentObject)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('content') content: string,
  ): Promise<CommentObject> {
    return this.contentService.updateComment(currentUser.userId, id, content);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @CurrentUser() currentUser: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.contentService.deleteComment(currentUser.userId, id, currentUser.role);
  }

  @Mutation(() => LikeResult)
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUser() currentUser: JwtPayload,
    @Args('targetType', { type: () => LikeTargetType }) targetType: LikeTargetType,
    @Args('targetId', { type: () => ID }) targetId: string,
  ): Promise<LikeResult> {
    return this.contentService.toggleLike(currentUser.userId, targetType, targetId);
  }

  @Mutation(() => DislikeResult)
  @UseGuards(JwtAuthGuard)
  async toggleDislike(
    @CurrentUser() currentUser: JwtPayload,
    @Args('targetType', { type: () => DislikeTargetType }) targetType: DislikeTargetType,
    @Args('targetId', { type: () => ID }) targetId: string,
  ): Promise<DislikeResult> {
    return this.contentService.toggleDislike(currentUser.userId, targetType, targetId);
  }

  @Mutation(() => BookmarkResult)
  @UseGuards(JwtAuthGuard)
  async toggleBookmark(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
  ): Promise<BookmarkResult> {
    return this.contentService.toggleBookmark(currentUser.userId, novelId);
  }

  @Mutation(() => FavoriteResult)
  @UseGuards(JwtAuthGuard)
  async toggleFavorite(
    @CurrentUser() currentUser: JwtPayload,
    @Args('novelId', { type: () => ID }) novelId: string,
  ): Promise<FavoriteResult> {
    return this.contentService.toggleFavorite(currentUser.userId, novelId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async recommendEpisode(
    @CurrentUser() currentUser: JwtPayload,
    @Args('episodeId', { type: () => ID }) episodeId: string,
  ): Promise<boolean> {
    return this.contentService.recommendEpisode(currentUser.userId, episodeId);
  }

  @Mutation(() => ReportObject)
  @UseGuards(JwtAuthGuard)
  async report(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: ReportInput,
  ): Promise<ReportObject> {
    return this.contentService.report(currentUser.userId, input);
  }
}
