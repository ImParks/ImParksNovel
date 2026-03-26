import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DislikeTargetType, LikeTargetType, ReportTargetType } from '@prisma/client';
import {
  ContentRepository,
  PaginationOptions,
} from '../infrastructure/content.repository';
import {
  CommentOrderBy,
  CreateCommentInput,
  CreateReplyInput,
  ReportInput,
} from './dto/content.input';
import {
  BookmarkConnection,
  BookmarkEdge,
  BookmarkObject,
  BookmarkResult,
  CommentConnection,
  CommentEdge,
  CommentObject,
  DislikeResult,
  FavoriteConnection,
  FavoriteEdge,
  FavoriteObject,
  FavoriteResult,
  LikeResult,
  ReadingHistoryConnection,
  ReadingHistoryEdge,
  ReadingHistoryObject,
  ReportObject,
  ContentPageInfo,
} from './dto/content.object';

const AUTO_HIDE_REPORT_THRESHOLD = 3;

@Injectable()
export class ContentService {
  constructor(private readonly contentRepository: ContentRepository) {}

  // ──────────────────────────────────────────────
  // Comments
  // ──────────────────────────────────────────────

  async getComments(
    episodeId: string,
    orderBy: CommentOrderBy = CommentOrderBy.CREATED_AT_DESC,
    pagination: PaginationOptions = {},
  ): Promise<CommentConnection> {
    const { items, hasNextPage } = await this.contentRepository.findComments(
      episodeId,
      orderBy,
      pagination,
    );
    const totalCount = await this.contentRepository.countComments(episodeId);

    const edges: CommentEdge[] = items.map((c) => ({
      cursor: ContentRepository.encodeCursor(c.createdAt),
      node: this.toCommentObject(c),
    }));

    const pageInfo: ContentPageInfo = {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
    };

    return { edges, pageInfo, totalCount };
  }

  async createComment(userId: string, input: CreateCommentInput): Promise<CommentObject> {
    const comment = await this.contentRepository.createComment({
      userId,
      episodeId: input.episodeId,
      content: input.content,
      isSpoiler: input.isSpoiler ?? false,
      depth: 0,
    });
    return this.toCommentObject(comment);
  }

  async createReply(userId: string, input: CreateReplyInput): Promise<CommentObject> {
    const parent = await this.contentRepository.findCommentById(input.parentId);
    if (!parent || parent.deletedAt !== null) {
      throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
    }
    if (parent.depth >= 1) {
      throw new BadRequestException('대댓글에는 답글을 달 수 없습니다. (최대 2단계)');
    }

    const reply = await this.contentRepository.createComment({
      userId,
      episodeId: parent.episodeId,
      content: input.content,
      isSpoiler: false,
      parentId: parent.id,
      depth: parent.depth + 1,
    });
    return this.toCommentObject(reply);
  }

  async updateComment(userId: string, id: string, content: string): Promise<CommentObject> {
    const comment = await this.contentRepository.findCommentById(id);
    if (!comment || comment.deletedAt !== null) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('댓글 수정 권한이 없습니다.');
    }

    const updated = await this.contentRepository.updateComment(id, {
      content,
      isEdited: true,
      editedAt: new Date(),
    });
    return this.toCommentObject(updated);
  }

  async deleteComment(userId: string, id: string, role: string): Promise<boolean> {
    const comment = await this.contentRepository.findCommentById(id);
    if (!comment || comment.deletedAt !== null) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('댓글 삭제 권한이 없습니다.');
    }

    await this.contentRepository.softDeleteComment(id);
    return true;
  }

  // ──────────────────────────────────────────────
  // Likes
  // ──────────────────────────────────────────────

  async toggleLike(
    userId: string,
    targetType: LikeTargetType,
    targetId: string,
  ): Promise<LikeResult> {
    const existing = await this.contentRepository.findLike(userId, targetType, targetId);

    if (existing) {
      await this.contentRepository.deleteLike(userId, targetType, targetId);
      if (targetType === LikeTargetType.COMMENT) {
        await this.contentRepository.incrementCommentLikeCount(targetId, -1);
      }
    } else {
      await this.contentRepository.createLike({ userId, targetType, targetId });
      if (targetType === LikeTargetType.COMMENT) {
        await this.contentRepository.incrementCommentLikeCount(targetId, 1);
      }
    }

    const count = await this.contentRepository.countLikes(targetType, targetId);
    return { isLiked: !existing, count };
  }

  async isLiked(
    userId: string,
    targetType: LikeTargetType,
    targetId: string,
  ): Promise<boolean> {
    const existing = await this.contentRepository.findLike(userId, targetType, targetId);
    return !!existing;
  }

  // ──────────────────────────────────────────────
  // Dislikes
  // ──────────────────────────────────────────────

  async toggleDislike(
    userId: string,
    targetType: DislikeTargetType,
    targetId: string,
  ): Promise<DislikeResult> {
    const existing = await this.contentRepository.findDislike(userId, targetType, targetId);

    if (existing) {
      await this.contentRepository.deleteDislike(userId, targetType, targetId);
    } else {
      await this.contentRepository.createDislike({ userId, targetType, targetId });
    }

    const count = await this.contentRepository.countDislikes(targetType, targetId);
    return { isDisliked: !existing, count };
  }

  // ──────────────────────────────────────────────
  // Bookmarks
  // ──────────────────────────────────────────────

  async toggleBookmark(userId: string, novelId: string): Promise<BookmarkResult> {
    const existing = await this.contentRepository.findBookmark(userId, novelId);

    if (existing) {
      await this.contentRepository.deleteBookmark(userId, novelId);
      return { isBookmarked: false };
    } else {
      await this.contentRepository.createBookmark({ userId, novelId });
      return { isBookmarked: true };
    }
  }

  async isBookmarked(userId: string, novelId: string): Promise<boolean> {
    const existing = await this.contentRepository.findBookmark(userId, novelId);
    return !!existing;
  }

  async getMyBookmarks(
    userId: string,
    pagination: PaginationOptions = {},
  ): Promise<BookmarkConnection> {
    const { items, hasNextPage, totalCount } =
      await this.contentRepository.findUserBookmarks(userId, pagination);

    const edges: BookmarkEdge[] = items.map((b) => ({
      cursor: ContentRepository.encodeCursor(b.createdAt),
      node: this.toBookmarkObject(b),
    }));

    const pageInfo: ContentPageInfo = {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
    };

    return { edges, pageInfo, totalCount };
  }

  // ──────────────────────────────────────────────
  // Favorites
  // ──────────────────────────────────────────────

  async toggleFavorite(userId: string, novelId: string): Promise<FavoriteResult> {
    const existing = await this.contentRepository.findFavorite(userId, novelId);

    if (existing) {
      await this.contentRepository.deleteFavorite(userId, novelId);
      return { isFavorited: false };
    } else {
      await this.contentRepository.createFavorite({ userId, novelId });
      return { isFavorited: true };
    }
  }

  async isFavorited(userId: string, novelId: string): Promise<boolean> {
    const existing = await this.contentRepository.findFavorite(userId, novelId);
    return !!existing;
  }

  async getMyFavorites(
    userId: string,
    pagination: PaginationOptions = {},
  ): Promise<FavoriteConnection> {
    const { items, hasNextPage, totalCount } =
      await this.contentRepository.findUserFavorites(userId, pagination);

    const edges: FavoriteEdge[] = items.map((f) => ({
      cursor: ContentRepository.encodeCursor(f.createdAt),
      node: this.toFavoriteObject(f),
    }));

    const pageInfo: ContentPageInfo = {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
    };

    return { edges, pageInfo, totalCount };
  }

  // ──────────────────────────────────────────────
  // ReadingHistory
  // ──────────────────────────────────────────────

  async getRecentReads(
    userId: string,
    pagination: PaginationOptions = {},
  ): Promise<ReadingHistoryConnection> {
    const { items, hasNextPage, totalCount } =
      await this.contentRepository.findUserRecentReads(userId, pagination);

    const edges: ReadingHistoryEdge[] = items.map((r) => ({
      cursor: ContentRepository.encodeCursor(r.lastReadAt),
      node: this.toReadingHistoryObject(r),
    }));

    const pageInfo: ContentPageInfo = {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
    };

    return { edges, pageInfo, totalCount };
  }

  // ──────────────────────────────────────────────
  // Recommendations
  // ──────────────────────────────────────────────

  async recommendEpisode(userId: string, episodeId: string): Promise<boolean> {
    const existing = await this.contentRepository.findRecommendation(userId, episodeId);
    if (existing) {
      throw new ConflictException({
        code: 'RECOMMEND_001',
        message: '이미 추천한 에피소드입니다.',
      });
    }

    await this.contentRepository.createRecommendation({ userId, episodeId });
    return true;
  }

  // ──────────────────────────────────────────────
  // Reports
  // ──────────────────────────────────────────────

  async report(userId: string, input: ReportInput): Promise<ReportObject> {
    // 자기 자신 신고 불가 - targetType이 USER인 경우만 체크
    if (input.targetType === ReportTargetType.USER && input.targetId === userId) {
      throw new BadRequestException({
        code: 'REPORT_002',
        message: '자기 자신을 신고할 수 없습니다.',
      });
    }

    const alreadyReported = await this.contentRepository.findExistingReport(
      userId,
      input.targetType,
      input.targetId,
    );
    if (alreadyReported) {
      throw new ConflictException({
        code: 'REPORT_001',
        message: '이미 신고한 대상입니다.',
      });
    }

    const createdReport = await this.contentRepository.createReport({
      reporterId: userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description,
    });

    // 3건 이상 신고 시 댓글 자동 숨김
    if (input.targetType === ReportTargetType.COMMENT) {
      const reportCount = await this.contentRepository.countReports(
        input.targetType,
        input.targetId,
      );
      if (reportCount >= AUTO_HIDE_REPORT_THRESHOLD) {
        await this.contentRepository.hideComment(input.targetId);
      }
    }

    return this.toReportObject(createdReport);
  }

  // ──────────────────────────────────────────────
  // Private mappers
  // ──────────────────────────────────────────────

  private toCommentObject(comment: {
    id: string;
    userId: string;
    episodeId: string;
    content: string;
    isSpoiler: boolean;
    parentId?: string | null;
    depth: number;
    isPinned: boolean;
    isEdited: boolean;
    editedAt?: Date | null;
    likeCount: number;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    replies?: Array<{
      id: string;
      userId: string;
      episodeId: string;
      content: string;
      isSpoiler: boolean;
      parentId?: string | null;
      depth: number;
      isPinned: boolean;
      isEdited: boolean;
      editedAt?: Date | null;
      likeCount: number;
      isHidden: boolean;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    }>;
  }): CommentObject {
    return {
      id: comment.id,
      userId: comment.userId,
      episodeId: comment.episodeId,
      content: comment.content,
      isSpoiler: comment.isSpoiler,
      parentId: comment.parentId ?? undefined,
      depth: comment.depth,
      isPinned: comment.isPinned,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt ?? undefined,
      likeCount: comment.likeCount,
      isHidden: comment.isHidden,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt ?? undefined,
      replies: (comment.replies ?? []).map((r) => this.toCommentObject({ ...r, replies: [] })),
    };
  }

  private toBookmarkObject(bookmark: {
    id: string;
    userId: string;
    novelId: string;
    notifyNewEpisode: boolean;
    folderId?: string | null;
    createdAt: Date;
  }): BookmarkObject {
    return {
      id: bookmark.id,
      userId: bookmark.userId,
      novelId: bookmark.novelId,
      notifyNewEpisode: bookmark.notifyNewEpisode,
      folderId: bookmark.folderId ?? undefined,
      createdAt: bookmark.createdAt,
    };
  }

  private toFavoriteObject(favorite: {
    id: string;
    userId: string;
    novelId: string;
    createdAt: Date;
  }): FavoriteObject {
    return {
      id: favorite.id,
      userId: favorite.userId,
      novelId: favorite.novelId,
      createdAt: favorite.createdAt,
    };
  }

  private toReadingHistoryObject(history: {
    id: string;
    userId: string;
    novelId: string;
    lastEpisodeId: string;
    lastEpisodeNumber: number;
    scrollPosition?: number | null;
    lastReadAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ReadingHistoryObject {
    return {
      id: history.id,
      userId: history.userId,
      novelId: history.novelId,
      lastEpisodeId: history.lastEpisodeId,
      lastEpisodeNumber: history.lastEpisodeNumber,
      scrollPosition: history.scrollPosition ?? undefined,
      lastReadAt: history.lastReadAt,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    };
  }

  private toReportObject(report: {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    description?: string | null;
    status: import('@prisma/client').ReportStatus;
    createdAt: Date;
    updatedAt: Date;
  }): ReportObject {
    return {
      id: report.id,
      reporterId: report.reporterId,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description ?? undefined,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}
