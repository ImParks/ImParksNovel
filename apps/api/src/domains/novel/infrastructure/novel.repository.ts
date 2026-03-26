import { Injectable } from '@nestjs/common';
import { EpisodeStatus, NovelStatus, Prisma, SerializationType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface PaginationArgs {
  first?: number;
  after?: string;
}

// ──────────────────────────────────────────────
// Internal cursor helpers
// ──────────────────────────────────────────────

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf8');
}

@Injectable()
export class NovelRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Novel CRUD
  // ──────────────────────────────────────────────

  async findById(id: string) {
    return this.prisma.novel.findFirst({ where: { id, deletedAt: null } });
  }

  async findByAuthorId(
    authorId: string,
    status?: NovelStatus,
    pagination?: PaginationArgs,
  ) {
    const limit = pagination?.first ?? 20;
    const cursor = pagination?.after ? decodeCursor(pagination.after) : undefined;

    const where: Prisma.NovelWhereInput = {
      authorId,
      deletedAt: null,
      ...(status && { status }),
    };

    const novels = await this.prisma.novel.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = novels.length > limit;
    const items = hasNextPage ? novels.slice(0, limit) : novels;

    const totalCount = await this.prisma.novel.count({ where });

    return {
      items,
      hasNextPage,
      endCursor: items.length > 0 ? encodeCursor(items[items.length - 1].id) : null,
      totalCount,
    };
  }

  async create(data: {
    authorId: string;
    title: string;
    synopsis: string;
    coverImageUrl?: string;
    genreId: string;
    tags: string[];
    isAdultOnly: boolean;
  }) {
    return this.prisma.novel.create({ data });
  }

  async update(id: string, data: Prisma.NovelUpdateInput) {
    return this.prisma.novel.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.novel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────────
  // Episode CRUD
  // ──────────────────────────────────────────────

  async findEpisodes(
    novelId: string,
    status?: EpisodeStatus,
    pagination?: PaginationArgs,
  ) {
    const limit = pagination?.first ?? 20;
    const cursor = pagination?.after ? decodeCursor(pagination.after) : undefined;

    const where: Prisma.EpisodeWhereInput = {
      novelId,
      deletedAt: null,
      ...(status && { status }),
    };

    const episodes = await this.prisma.episode.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { episodeNumber: 'asc' },
    });

    const hasNextPage = episodes.length > limit;
    const items = hasNextPage ? episodes.slice(0, limit) : episodes;

    const totalCount = await this.prisma.episode.count({ where });

    return {
      items,
      hasNextPage,
      endCursor: items.length > 0 ? encodeCursor(items[items.length - 1].id) : null,
      totalCount,
    };
  }

  async findEpisodeById(id: string) {
    return this.prisma.episode.findFirst({ where: { id, deletedAt: null } });
  }

  async createEpisode(data: {
    novelId: string;
    authorId: string;
    episodeNumber: number;
    title: string;
    content: string;
    wordCount: number;
    isFree: boolean;
    price?: number;
  }) {
    return this.prisma.episode.create({ data });
  }

  async updateEpisode(id: string, data: Prisma.EpisodeUpdateInput) {
    return this.prisma.episode.update({ where: { id }, data });
  }

  async softDeleteEpisode(id: string) {
    return this.prisma.episode.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getNextEpisodeNumber(novelId: string): Promise<number> {
    const last = await this.prisma.episode.findFirst({
      where: { novelId, deletedAt: null },
      orderBy: { episodeNumber: 'desc' },
      select: { episodeNumber: true },
    });
    return (last?.episodeNumber ?? 0) + 1;
  }

  async countPublishedFreeEpisodes(novelId: string): Promise<number> {
    return this.prisma.episode.count({
      where: {
        novelId,
        status: EpisodeStatus.PUBLISHED,
        isFree: true,
        deletedAt: null,
      },
    });
  }

  // ──────────────────────────────────────────────
  // Serialization schedule
  // ──────────────────────────────────────────────

  async findSchedule(novelId: string) {
    return this.prisma.novelSerializationSchedule.findUnique({ where: { novelId } });
  }

  async upsertSchedule(
    novelId: string,
    data: {
      type: SerializationType;
      serialDays?: string[];
      serialCount?: number;
      preferredTime?: string;
    },
  ) {
    return this.prisma.novelSerializationSchedule.upsert({
      where: { novelId },
      create: {
        novelId,
        type: data.type,
        serialDays: data.serialDays ?? [],
        serialCount: data.serialCount,
        preferredTime: data.preferredTime,
      },
      update: {
        type: data.type,
        serialDays: data.serialDays ?? [],
        serialCount: data.serialCount,
        preferredTime: data.preferredTime,
      },
    });
  }

  // ──────────────────────────────────────────────
  // Drafts
  // ──────────────────────────────────────────────

  async findDrafts(authorId: string, novelId?: string) {
    return this.prisma.episodeDraft.findMany({
      where: {
        authorId,
        ...(novelId && { novelId }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertDraft(data: {
    novelId: string;
    authorId: string;
    episodeId?: string;
    title?: string;
    content?: string;
  }) {
    const updatePayload = {
      title: data.title,
      content: data.content,
      lastSyncedAt: new Date(),
    };

    // For episode-linked drafts: find existing and update, or create new
    if (data.episodeId) {
      const existing = await this.prisma.episodeDraft.findFirst({
        where: { authorId: data.authorId, episodeId: data.episodeId },
      });

      if (existing) {
        return this.prisma.episodeDraft.update({
          where: { id: existing.id },
          data: updatePayload,
        });
      }

      return this.prisma.episodeDraft.create({
        data: {
          novelId: data.novelId,
          authorId: data.authorId,
          episodeId: data.episodeId,
          title: data.title,
          content: data.content,
          lastSyncedAt: new Date(),
        },
      });
    }

    // Standalone draft (not linked to episode): always create new
    return this.prisma.episodeDraft.create({
      data: {
        novelId: data.novelId,
        authorId: data.authorId,
        title: data.title,
        content: data.content,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ──────────────────────────────────────────────
  // Reading progress
  // ──────────────────────────────────────────────

  async findReadingProgress(userId: string, novelId: string) {
    return this.prisma.readingHistory.findUnique({
      where: { userId_novelId: { userId, novelId } },
    });
  }

  async upsertReadingProgress(data: {
    userId: string;
    novelId: string;
    lastEpisodeId: string;
    lastEpisodeNumber: number;
    scrollPosition?: number;
  }) {
    return this.prisma.readingHistory.upsert({
      where: { userId_novelId: { userId: data.userId, novelId: data.novelId } },
      create: {
        userId: data.userId,
        novelId: data.novelId,
        lastEpisodeId: data.lastEpisodeId,
        lastEpisodeNumber: data.lastEpisodeNumber,
        scrollPosition: data.scrollPosition ?? 0,
        lastReadAt: new Date(),
      },
      update: {
        lastEpisodeId: data.lastEpisodeId,
        lastEpisodeNumber: data.lastEpisodeNumber,
        scrollPosition: data.scrollPosition ?? 0,
        lastReadAt: new Date(),
      },
    });
  }

  // ──────────────────────────────────────────────
  // NovelDetail sub-queries
  // ──────────────────────────────────────────────

  async findRecentEpisodes(novelId: string, limit = 3) {
    return this.prisma.episode.findMany({
      where: { novelId, status: EpisodeStatus.PUBLISHED, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findSimilarNovels(genreId: string, excludeId: string, limit = 6) {
    return this.prisma.novel.findMany({
      where: {
        genreId,
        id: { not: excludeId },
        status: NovelStatus.SERIALIZING,
        deletedAt: null,
      },
      orderBy: { totalViews: 'desc' },
      take: limit,
    });
  }

  async findAuthorOtherNovels(authorId: string, excludeId: string, limit = 6) {
    return this.prisma.novel.findMany({
      where: {
        authorId,
        id: { not: excludeId },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
