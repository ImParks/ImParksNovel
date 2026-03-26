import { Injectable } from '@nestjs/common';
import { Prisma, NovelStatus, RankingType, RankingPeriod } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

// ──────────────────────────────────────────────
// Pagination & Cursor
// ──────────────────────────────────────────────

export interface PaginationArgs {
  first?: number;
  after?: string;
}

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf8');
}

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Novel Search
  // ──────────────────────────────────────────────

  /**
   * Search novels by title or synopsis with filters.
   * Uses ILIKE (case-insensitive) for text search.
   * Returns paginated results sorted by relevance/date.
   */
  async searchNovels(
    query?: string,
    filters?: {
      genreIds?: string[];
      tagIds?: string[];
      status?: NovelStatus;
      isAdultOnly?: boolean;
      minEpisodes?: number;
    },
    sort?: 'RELEVANCE' | 'LATEST' | 'VIEWS' | 'LIKES' | 'BOOKMARKS',
    first?: number,
    after?: string,
  ) {
    const take = first ?? 20;
    const cursor = after ? decodeCursor(after) : undefined;

    const where: Prisma.NovelWhereInput = {
      deletedAt: null,
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { synopsis: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(filters?.genreIds && { genreId: { in: filters.genreIds } }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.isAdultOnly !== undefined && { isAdultOnly: filters.isAdultOnly }),
      ...(filters?.minEpisodes && { totalEpisodes: { gte: filters.minEpisodes } }),
      // Tag filtering: ANY tag in filters.tagIds must be present
      ...(filters?.tagIds && filters.tagIds.length > 0 && {
        tags: { hasSome: filters.tagIds },
      }),
    };

    const orderBy = this._getSortOrder(sort);

    const novels = await this.prisma.novel.findMany({
      where,
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy,
      // Note: Novel has authorId/genreId (no relation). Names resolved at service layer.
    });

    const hasNextPage = novels.length > take;
    if (hasNextPage) novels.pop();

    const totalCount = await this.prisma.novel.count({ where });

    return {
      novels: novels.map((n) => ({
        ...n,
        authorName: n.authorId,
        genreName: n.genreId,
      })),
      totalCount,
      hasNextPage,
      endCursor: novels.length > 0 ? encodeCursor(novels[novels.length - 1].id) : null,
    };
  }

  // ──────────────────────────────────────────────
  // Genre-based Novel Listing
  // ──────────────────────────────────────────────

  /**
   * Find novels by genre with optional filters and sorting.
   */
  async findNovelsByGenre(
    genreId: string,
    sort?: 'LATEST' | 'VIEWS' | 'LIKES' | 'BOOKMARKS',
    filters?: {
      status?: NovelStatus;
      minEpisodes?: number;
    },
    first?: number,
    after?: string,
  ) {
    const take = first ?? 20;
    const cursor = after ? decodeCursor(after) : undefined;

    const where: Prisma.NovelWhereInput = {
      genreId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.minEpisodes && { totalEpisodes: { gte: filters.minEpisodes } }),
    };

    const orderBy = this._getSortOrder(sort);

    const novels = await this.prisma.novel.findMany({
      where,
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy,
      // Note: Novel has authorId/genreId (no relation). Names resolved at service layer.
    });

    const hasNextPage = novels.length > take;
    if (hasNextPage) novels.pop();

    const totalCount = await this.prisma.novel.count({ where });

    return {
      novels: novels.map((n) => ({
        ...n,
        authorName: n.authorId,
        genreName: n.genreId,
      })),
      totalCount,
      hasNextPage,
      endCursor: novels.length > 0 ? encodeCursor(novels[novels.length - 1].id) : null,
    };
  }

  // ──────────────────────────────────────────────
  // Rankings
  // ──────────────────────────────────────────────

  /**
   * Find rankings by type, period, and optional genre filter.
   */
  async findRankings(
    type: RankingType,
    period: RankingPeriod,
    genreId?: string,
    limit?: number,
  ) {
    const take = limit ?? 50;

    const where: Prisma.RankingWhereInput = {
      rankingType: type,
      period,
      ...(genreId && { genreId }),
    };

    const rankings = await this.prisma.ranking.findMany({
      where,
      take,
      orderBy: { rank: 'asc' },
    });

    // Fetch novels for rankings
    const novelIds = rankings.map((r) => r.novelId);
    const novels = await this.prisma.novel.findMany({
      where: { id: { in: novelIds } },
    });
    const novelMap = new Map(novels.map((n) => [n.id, n]));

    return {
      type,
      period,
      genreId,
      entries: rankings.map((r) => {
        const novel = novelMap.get(r.novelId);
        return {
          rank: r.rank,
          previousRank: r.previousRank,
          rankChange: r.rankChange,
          score: r.score,
          novel: novel
            ? {
                id: novel.id,
                title: novel.title,
                synopsis: novel.synopsis,
                coverImageUrl: novel.coverImageUrl,
                authorName: novel.authorId,
                genreName: novel.genreId,
                tags: novel.tags,
                status: novel.status,
                totalEpisodes: novel.totalEpisodes,
                totalViews: novel.totalViews,
                totalLikes: novel.totalLikes,
                totalBookmarks: novel.totalBookmarks,
                isAdultOnly: novel.isAdultOnly,
                createdAt: novel.createdAt,
              }
            : null,
        };
      }).filter((e) => e.novel !== null),
      updatedAt: rankings[0]?.calculatedAt || new Date(),
    };
  }

  /**
   * Find trending novels based on recent realtime ranking (24h).
   */
  async findTrendingNovels(limit?: number) {
    const take = limit ?? 20;

    // Get realtime rankings (most recent REALTIME period data)
    const rankings = await this.prisma.ranking.findMany({
      where: {
        rankingType: RankingType.REALTIME,
        period: RankingPeriod.DAILY,
      },
      take,
      orderBy: { score: 'desc' },
    });

    const novelIds = rankings.map((r) => r.novelId);
    const novels = await this.prisma.novel.findMany({
      where: { id: { in: novelIds } },
    });
    const novelMap = new Map(novels.map((n) => [n.id, n]));

    return rankings
      .map((r) => novelMap.get(r.novelId))
      .filter((n): n is NonNullable<typeof n> => n !== undefined)
      .map((n) => ({
        id: n.id,
        title: n.title,
        synopsis: n.synopsis,
        coverImageUrl: n.coverImageUrl,
        authorName: n.authorId,
        genreName: n.genreId,
        tags: n.tags,
        status: n.status,
        totalEpisodes: n.totalEpisodes,
        totalViews: n.totalViews,
        totalLikes: n.totalLikes,
        totalBookmarks: n.totalBookmarks,
        isAdultOnly: n.isAdultOnly,
        createdAt: n.createdAt,
      }));
  }

  /**
   * Find recently released novels (created in last 30 days).
   */
  async findNewReleases(genreId?: string, limit?: number) {
    const take = limit ?? 20;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where: Prisma.NovelWhereInput = {
      createdAt: { gte: thirtyDaysAgo },
      deletedAt: null,
      ...(genreId && { genreId }),
    };

    const novels = await this.prisma.novel.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return novels.map((n) => ({
      ...n,
      authorName: n.authorId,
      genreName: n.genreId,
    }));
  }

  // ──────────────────────────────────────────────
  // View Tracking
  // ──────────────────────────────────────────────

  /**
   * Record a view for an episode.
   * Prevents duplicate views from same user/session within 5 minutes.
   */
  async recordView(
    episodeId: string,
    ipAddress: string,
    userId?: string,
    sessionId?: string,
    userAgent?: string,
  ) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Check for recent duplicate view
    const orConditions = [
      ...(userId ? [{ userId }] : []),
      ...(sessionId ? [{ sessionId }] : []),
      { ipAddress },
    ];

    const recentView = await this.prisma.viewCount.findFirst({
      where: {
        episodeId,
        viewedAt: { gte: fiveMinutesAgo },
        OR: orConditions,
      },
    });

    if (recentView) {
      return recentView; // Return existing view, don't create duplicate
    }

    return this.prisma.viewCount.create({
      data: {
        episodeId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        isValid: true,
      },
    });
  }

  /**
   * Get total view count for an episode.
   */
  async getViewCount(episodeId: string): Promise<number> {
    const result = await this.prisma.viewCount.aggregate({
      where: { episodeId, isValid: true },
      _count: true,
    });
    return result._count;
  }

  // ──────────────────────────────────────────────
  // Recommendations
  // ──────────────────────────────────────────────

  /**
   * Find novels similar to a given novel based on genre and tags.
   */
  async findSimilarNovels(novelId: string, limit?: number) {
    const take = limit ?? 10;

    const sourceNovel = await this.prisma.novel.findUnique({
      where: { id: novelId },
      select: { genreId: true, tags: true },
    });

    if (!sourceNovel) return [];

    const orConditions = [
      { genreId: sourceNovel.genreId },
      ...(sourceNovel.tags.length > 0 ? [{ tags: { hasSome: sourceNovel.tags } }] : []),
    ];

    const similar = await this.prisma.novel.findMany({
      where: {
        id: { not: novelId },
        deletedAt: null,
        OR: orConditions,
      },
      take,
      orderBy: { totalViews: 'desc' },
    });

    return similar.map((n) => ({
      ...n,
      authorName: n.authorId,
      genreName: n.genreId,
    }));
  }

  /**
   * Find personalized recommendations based on user's reading history.
   * Note: This is simplified - in production, use a separate recommendation engine.
   */
  async findPersonalizedRecommendations(userId: string, limit?: number) {
    const take = limit ?? 10;

    // Get novels user has read (via episodePurchase or reading history)
    const readNovels = await this.prisma.episodePurchase.findMany({
      where: { userId },
      select: { novelId: true },
      distinct: ['novelId'],
      take: 5,
    });

    const readNovelIds = readNovels.map((r) => r.novelId);

    if (readNovelIds.length === 0) {
      // Fallback: return trending novels
      return this.findTrendingNovels(take);
    }

    // Find genres and tags from read novels
    const genres = await this.prisma.novel.findMany({
      where: { id: { in: readNovelIds } },
      select: { genreId: true, tags: true },
    });

    const genreIds = [...new Set(genres.map((g) => g.genreId))];
    const allTags = [...new Set(genres.flatMap((g) => g.tags))];

    // Find novels with similar genres or tags, excluding already read
    const orConditions: Prisma.NovelWhereInput[] = [];
    if (genreIds.length > 0) {
      orConditions.push({ genreId: { in: genreIds } });
    }
    if (allTags.length > 0) {
      orConditions.push({ tags: { hasSome: allTags } });
    }

    const recommendations = await this.prisma.novel.findMany({
      where: {
        id: { notIn: readNovelIds },
        deletedAt: null,
        ...(orConditions.length > 0 ? { OR: orConditions } : {}),
      },
      take,
      orderBy: { totalViews: 'desc' },
    });

    return recommendations.map((n) => ({
      ...n,
      authorName: n.authorId,
      genreName: n.genreId,
    }));
  }

  // ──────────────────────────────────────────────
  // Popular Search Terms
  // ──────────────────────────────────────────────

  /**
   * Find popular search terms for a given period (hourly, daily, weekly).
   */
  async findPopularSearchTerms(period: 'hourly' | 'daily' | 'weekly', limit?: number) {
    const take = limit ?? 20;

    // Get the most recent period data
    const latestPeriod = await this.prisma.searchKeyword.findFirst({
      where: { period },
      orderBy: { periodStart: 'desc' },
      select: { periodStart: true },
    });

    if (!latestPeriod) return [];

    const terms = await this.prisma.searchKeyword.findMany({
      where: {
        period,
        periodStart: latestPeriod.periodStart,
      },
      take,
      orderBy: { rank: 'asc' },
    });

    return terms.map((t, index) => ({
      rank: t.rank || index + 1,
      term: t.keyword,
      isNew: !t.previousRank,
      isRising: t.previousRank ? t.previousRank > (t.rank || index + 1) : false,
    }));
  }

  /**
   * Increment search count for a keyword (upsert).
   */
  async incrementSearchKeyword(keyword: string, period: 'hourly' | 'daily' | 'weekly') {
    const now = new Date();
    const periodStart = this._getPeriodStart(now, period);

    return this.prisma.searchKeyword.upsert({
      where: {
        keyword_period_periodStart: {
          keyword,
          period,
          periodStart,
        },
      },
      update: {
        searchCount: { increment: 1 },
        updatedAt: now,
      },
      create: {
        keyword,
        searchCount: 1,
        period,
        periodStart,
      },
    });
  }

  // ──────────────────────────────────────────────
  // Share Links
  // ──────────────────────────────────────────────

  /**
   * Create a share link for a novel.
   */
  async createShareLink(
    novelId: string,
    platform: string,
    shareCode: string,
    sharerId?: string,
  ) {
    return this.prisma.novelShareLink.create({
      data: {
        novelId,
        sharerId,
        platform,
        shareCode,
      },
    });
  }

  /**
   * Increment click count for a share link.
   */
  async incrementShareLinkClick(shareCode: string) {
    return this.prisma.novelShareLink.update({
      where: { shareCode },
      data: { clickCount: { increment: 1 } },
    });
  }

  /**
   * Get share statistics for a novel.
   */
  async getShareStatistics(novelId: string) {
    const totalClicks = await this.prisma.novelShareLink.aggregate({
      where: { novelId },
      _sum: { clickCount: true },
    });

    const byPlatform = await this.prisma.novelShareLink.groupBy({
      by: ['platform'],
      where: { novelId },
      _sum: { clickCount: true },
    });

    return {
      totalClicks: totalClicks._sum.clickCount || 0,
      byPlatform: byPlatform.map((p) => ({
        platform: p.platform,
        clicks: p._sum.clickCount || 0,
      })),
    };
  }

  // ──────────────────────────────────────────────
  // Helper Methods
  // ──────────────────────────────────────────────

  private _getSortOrder(
    sort?: 'RELEVANCE' | 'LATEST' | 'VIEWS' | 'LIKES' | 'BOOKMARKS',
  ): Prisma.NovelOrderByWithRelationInput {
    switch (sort) {
      case 'LATEST':
        return { createdAt: 'desc' };
      case 'VIEWS':
        return { totalViews: 'desc' };
      case 'LIKES':
        return { totalLikes: 'desc' };
      case 'BOOKMARKS':
        return { totalBookmarks: 'desc' };
      case 'RELEVANCE':
      default:
        return { totalViews: 'desc' }; // Default: by views
    }
  }

  private _getPeriodStart(now: Date, period: 'hourly' | 'daily' | 'weekly'): Date {
    const start = new Date(now);
    switch (period) {
      case 'hourly':
        start.setMinutes(0, 0, 0);
        break;
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(start.getDate() - start.getDay()); // Sunday start
        start.setHours(0, 0, 0, 0);
        break;
    }
    return start;
  }
}
