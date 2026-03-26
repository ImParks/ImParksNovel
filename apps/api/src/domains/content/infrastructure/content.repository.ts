import { Injectable } from '@nestjs/common';
import { DislikeTargetType, LikeTargetType, ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CommentOrderBy } from '../application/dto/content.input';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PaginationOptions {
  first?: number;
  after?: string;
}

export interface CreateCommentData {
  userId: string;
  episodeId: string;
  content: string;
  isSpoiler?: boolean;
  parentId?: string;
  depth: number;
}

export interface CreateLikeData {
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
}

export interface CreateDislikeData {
  userId: string;
  targetType: DislikeTargetType;
  targetId: string;
}

export interface CreateBookmarkData {
  userId: string;
  novelId: string;
  notifyNewEpisode?: boolean;
  folderId?: string;
}

export interface CreateFavoriteData {
  userId: string;
  novelId: string;
}

export interface CreateRecommendationData {
  userId: string;
  episodeId: string;
}

export interface CreateReportData {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

@Injectable()
export class ContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Cursor helpers
  // ──────────────────────────────────────────────

  static encodeCursor(createdAt: Date): string {
    return Buffer.from(createdAt.toISOString()).toString('base64');
  }

  private async cursorToDate(cursor: string): Promise<Date> {
    return new Date(Buffer.from(cursor, 'base64').toString('utf8'));
  }

  // ──────────────────────────────────────────────
  // Comments
  // ──────────────────────────────────────────────

  async findComments(
    episodeId: string,
    orderBy: CommentOrderBy = CommentOrderBy.CREATED_AT_DESC,
    pagination: PaginationOptions = {},
  ) {
    const { first = 20, after } = pagination;

    const where: Record<string, unknown> = {
      episodeId,
      deletedAt: null,
      depth: 0,
    };

    if (after) {
      const cursorDate = await this.cursorToDate(after);
      if (orderBy === CommentOrderBy.CREATED_AT_DESC) {
        where.createdAt = { lt: cursorDate };
      }
    }

    const prismaOrderBy =
      orderBy === CommentOrderBy.LIKE_COUNT_DESC
        ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const rows = await this.prisma.comment.findMany({
      where,
      orderBy: prismaOrderBy,
      take: first + 1,
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const hasNextPage = rows.length > first;
    const items = hasNextPage ? rows.slice(0, first) : rows;

    return { items, hasNextPage };
  }

  async countComments(episodeId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { episodeId, deletedAt: null, depth: 0 },
    });
  }

  async findCommentById(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async createComment(data: CreateCommentData) {
    return this.prisma.comment.create({
      data: {
        userId: data.userId,
        episodeId: data.episodeId,
        content: data.content,
        isSpoiler: data.isSpoiler ?? false,
        parentId: data.parentId,
        depth: data.depth,
        likeCount: 0,
      },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateComment(id: string, data: { content: string; isEdited: boolean; editedAt: Date }) {
    return this.prisma.comment.update({
      where: { id },
      data,
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async softDeleteComment(id: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hideComment(id: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { isHidden: true, hiddenAt: new Date() },
    });
  }

  // ──────────────────────────────────────────────
  // Likes
  // ──────────────────────────────────────────────

  async findLike(userId: string, targetType: LikeTargetType, targetId: string) {
    return this.prisma.like.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
  }

  async createLike(data: CreateLikeData) {
    return this.prisma.like.create({ data });
  }

  async deleteLike(userId: string, targetType: LikeTargetType, targetId: string) {
    return this.prisma.like.delete({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
  }

  async countLikes(targetType: LikeTargetType, targetId: string): Promise<number> {
    return this.prisma.like.count({ where: { targetType, targetId } });
  }

  async incrementCommentLikeCount(commentId: string, delta: number) {
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: delta } },
    });
  }

  // ──────────────────────────────────────────────
  // Dislikes
  // ──────────────────────────────────────────────

  async findDislike(userId: string, targetType: DislikeTargetType, targetId: string) {
    return this.prisma.dislike.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
  }

  async createDislike(data: CreateDislikeData) {
    return this.prisma.dislike.create({ data });
  }

  async deleteDislike(userId: string, targetType: DislikeTargetType, targetId: string) {
    return this.prisma.dislike.delete({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
  }

  async countDislikes(targetType: DislikeTargetType, targetId: string): Promise<number> {
    return this.prisma.dislike.count({ where: { targetType, targetId } });
  }

  // ──────────────────────────────────────────────
  // Bookmarks
  // ──────────────────────────────────────────────

  async findBookmark(userId: string, novelId: string) {
    return this.prisma.bookmark.findUnique({
      where: { userId_novelId: { userId, novelId } },
    });
  }

  async createBookmark(data: CreateBookmarkData) {
    return this.prisma.bookmark.create({
      data: {
        userId: data.userId,
        novelId: data.novelId,
        notifyNewEpisode: data.notifyNewEpisode ?? true,
        folderId: data.folderId,
      },
    });
  }

  async deleteBookmark(userId: string, novelId: string) {
    return this.prisma.bookmark.delete({
      where: { userId_novelId: { userId, novelId } },
    });
  }

  async findUserBookmarks(userId: string, pagination: PaginationOptions = {}) {
    const { first = 20, after } = pagination;

    const where: Record<string, unknown> = { userId };
    if (after) {
      where.createdAt = { lt: await this.cursorToDate(after) };
    }

    const rows = await this.prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: first + 1,
    });

    const hasNextPage = rows.length > first;
    const items = hasNextPage ? rows.slice(0, first) : rows;
    const totalCount = await this.prisma.bookmark.count({ where: { userId } });

    return { items, hasNextPage, totalCount };
  }

  // ──────────────────────────────────────────────
  // Favorites
  // ──────────────────────────────────────────────

  async findFavorite(userId: string, novelId: string) {
    return this.prisma.favorite.findUnique({
      where: { userId_novelId: { userId, novelId } },
    });
  }

  async createFavorite(data: CreateFavoriteData) {
    return this.prisma.favorite.create({ data });
  }

  async deleteFavorite(userId: string, novelId: string) {
    return this.prisma.favorite.delete({
      where: { userId_novelId: { userId, novelId } },
    });
  }

  async findUserFavorites(userId: string, pagination: PaginationOptions = {}) {
    const { first = 20, after } = pagination;

    const where: Record<string, unknown> = { userId };
    if (after) {
      where.createdAt = { lt: await this.cursorToDate(after) };
    }

    const rows = await this.prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: first + 1,
    });

    const hasNextPage = rows.length > first;
    const items = hasNextPage ? rows.slice(0, first) : rows;
    const totalCount = await this.prisma.favorite.count({ where: { userId } });

    return { items, hasNextPage, totalCount };
  }

  // ──────────────────────────────────────────────
  // ReadingHistory
  // ──────────────────────────────────────────────

  async findUserRecentReads(userId: string, pagination: PaginationOptions = {}) {
    const { first = 20, after } = pagination;
    const cappedFirst = Math.min(first, 50);

    const where: Record<string, unknown> = { userId };
    if (after) {
      where.lastReadAt = { lt: await this.cursorToDate(after) };
    }

    const rows = await this.prisma.readingHistory.findMany({
      where,
      orderBy: { lastReadAt: 'desc' },
      take: cappedFirst + 1,
    });

    const hasNextPage = rows.length > cappedFirst;
    const items = hasNextPage ? rows.slice(0, cappedFirst) : rows;
    const totalCount = await this.prisma.readingHistory.count({ where: { userId } });

    return { items, hasNextPage, totalCount };
  }

  // ──────────────────────────────────────────────
  // Recommendations
  // ──────────────────────────────────────────────

  async findRecommendation(userId: string, episodeId: string) {
    return this.prisma.recommendation.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
    });
  }

  async createRecommendation(data: CreateRecommendationData) {
    return this.prisma.recommendation.create({ data });
  }

  // ──────────────────────────────────────────────
  // Reports
  // ──────────────────────────────────────────────

  async findExistingReport(reporterId: string, targetType: ReportTargetType, targetId: string) {
    return this.prisma.report.findFirst({
      where: { reporterId, targetType, targetId },
    });
  }

  async createReport(data: CreateReportData) {
    return this.prisma.report.create({
      data: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
        status: ReportStatus.PENDING,
      },
    });
  }

  async countReports(targetType: ReportTargetType, targetId: string): Promise<number> {
    return this.prisma.report.count({ where: { targetType, targetId } });
  }
}
