import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EpisodeStatus, NovelStatus } from '@prisma/client';
import { NovelRepository } from '../infrastructure/novel.repository';
import { PaymentService } from '../../payment/application/payment.service';
import {
  CreateEpisodeInput,
  CreateNovelInput,
  ReadingProgressInput,
  SaveDraftInput,
  SerializationScheduleInput,
  UpdateEpisodeInput,
  UpdateNovelInput,
} from './dto/novel.input';
import {
  DraftObject,
  EpisodeConnection,
  EpisodeEdge,
  EpisodeObject,
  NovelConnection,
  NovelDetailObject,
  NovelEdge,
  NovelObject,
  PageInfo,
  ReadingProgressObject,
  SerializationScheduleObject,
} from './dto/novel.object';

const MIN_FREE_EPISODES_FOR_PAID = 3;
const PREVIEW_CONTENT_LENGTH = 200;

// ──────────────────────────────────────────────
// Mapping helpers
// ──────────────────────────────────────────────

function toNovelObject(novel: {
  id: string;
  authorId: string;
  title: string;
  synopsis: string;
  coverImageUrl?: string | null;
  genreId: string;
  tags: string[];
  status: NovelStatus;
  isAdultOnly: boolean;
  totalEpisodes: number;
  totalViews: number;
  totalLikes: number;
  totalDislikes: number;
  totalBookmarks: number;
  totalFavorites: number;
  totalSupports: number;
  aiContributionRatio?: number | null;
  createdAt: Date;
  updatedAt: Date;
}): NovelObject {
  return {
    id: novel.id,
    authorId: novel.authorId,
    title: novel.title,
    synopsis: novel.synopsis,
    coverImageUrl: novel.coverImageUrl ?? undefined,
    genreId: novel.genreId,
    tags: novel.tags,
    status: novel.status,
    isAdultOnly: novel.isAdultOnly,
    totalEpisodes: novel.totalEpisodes,
    totalViews: novel.totalViews,
    totalLikes: novel.totalLikes,
    totalDislikes: novel.totalDislikes,
    totalBookmarks: novel.totalBookmarks,
    totalFavorites: novel.totalFavorites,
    totalSupports: novel.totalSupports,
    aiContributionRatio: novel.aiContributionRatio ?? undefined,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
  };
}

function toEpisodeObject(episode: {
  id: string;
  novelId: string;
  authorId: string;
  episodeNumber: number;
  title: string;
  content: string;
  wordCount: number;
  status: EpisodeStatus;
  isFree: boolean;
  price?: number | null;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  recommendCount: number;
  commentCount: number;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  isEdited: boolean;
  editedAt?: Date | null;
  aiContributionRatio?: number | null;
  createdAt: Date;
  updatedAt: Date;
}): EpisodeObject {
  return {
    id: episode.id,
    novelId: episode.novelId,
    authorId: episode.authorId,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    content: episode.content,
    wordCount: episode.wordCount,
    status: episode.status,
    isFree: episode.isFree,
    price: episode.price ?? undefined,
    viewCount: episode.viewCount,
    likeCount: episode.likeCount,
    dislikeCount: episode.dislikeCount,
    recommendCount: episode.recommendCount,
    commentCount: episode.commentCount,
    scheduledAt: episode.scheduledAt ?? undefined,
    publishedAt: episode.publishedAt ?? undefined,
    isEdited: episode.isEdited,
    editedAt: episode.editedAt ?? undefined,
    aiContributionRatio: episode.aiContributionRatio ?? undefined,
    createdAt: episode.createdAt,
    updatedAt: episode.updatedAt,
  };
}

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

@Injectable()
export class NovelService {
  constructor(
    private readonly novelRepository: NovelRepository,
    private readonly paymentService: PaymentService,
  ) {}

  // ──────────────────────────────────────────────
  // Novel CRUD
  // ──────────────────────────────────────────────

  async createNovel(authorId: string, input: CreateNovelInput): Promise<NovelObject> {
    const novel = await this.novelRepository.create({
      authorId,
      title: input.title,
      synopsis: input.synopsis,
      coverImageUrl: input.coverImageUrl,
      genreId: input.genreId,
      tags: input.tags,
      isAdultOnly: input.isAdultOnly,
    });
    return toNovelObject(novel);
  }

  async updateNovel(
    requesterId: string,
    novelId: string,
    input: UpdateNovelInput,
  ): Promise<NovelObject> {
    const novel = await this.novelRepository.findById(novelId);
    if (!novel) {
      throw new NotFoundException('소설을 찾을 수 없습니다.');
    }
    if (novel.authorId !== requesterId) {
      throw new ForbiddenException('본인의 소설만 수정할 수 있습니다.');
    }

    const updated = await this.novelRepository.update(novelId, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.synopsis !== undefined && { synopsis: input.synopsis }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl }),
      ...(input.genreId !== undefined && { genreId: input.genreId }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.isAdultOnly !== undefined && { isAdultOnly: input.isAdultOnly }),
    });
    return toNovelObject(updated);
  }

  async deleteNovel(requesterId: string, novelId: string): Promise<boolean> {
    const novel = await this.novelRepository.findById(novelId);
    if (!novel) {
      throw new NotFoundException('소설을 찾을 수 없습니다.');
    }
    if (novel.authorId !== requesterId) {
      throw new ForbiddenException('본인의 소설만 삭제할 수 있습니다.');
    }

    // 구매된 유료 회차가 있으면 삭제 불가
    const hasPurchases = await this.paymentService.hasNovelPurchases(novelId);
    if (hasPurchases) {
      throw new BadRequestException('구매된 유료 회차가 있어 삭제할 수 없습니다. 비공개로 전환하세요.');
    }

    await this.novelRepository.softDelete(novelId);
    return true;
  }

  async updateNovelStatus(
    requesterId: string,
    novelId: string,
    status: NovelStatus,
  ): Promise<NovelObject> {
    const novel = await this.novelRepository.findById(novelId);
    if (!novel) {
      throw new NotFoundException('소설을 찾을 수 없습니다.');
    }
    if (novel.authorId !== requesterId) {
      throw new ForbiddenException('본인의 소설만 상태를 변경할 수 있습니다.');
    }

    const updated = await this.novelRepository.update(novelId, { status });

    // TODO: 연재 상태 변경 시 serializationMark 처리 로직 추가 (Phase 2)

    return toNovelObject(updated);
  }

  async getNovel(id: string): Promise<NovelObject | null> {
    const novel = await this.novelRepository.findById(id);
    if (!novel) return null;
    return toNovelObject(novel);
  }

  async getMyNovels(
    authorId: string,
    status?: NovelStatus,
    first?: number,
    after?: string,
  ): Promise<NovelConnection> {
    const result = await this.novelRepository.findByAuthorId(authorId, status, {
      first,
      after,
    });

    const edges: NovelEdge[] = result.items.map((novel) => ({
      node: toNovelObject(novel),
      cursor: encodeCursor(novel.id),
    }));

    const pageInfo: PageInfo = {
      hasNextPage: result.hasNextPage,
      endCursor: result.endCursor ?? undefined,
    };

    return { edges, pageInfo, totalCount: result.totalCount };
  }

  async getNovelDetail(novelId: string): Promise<NovelDetailObject> {
    const novel = await this.novelRepository.findById(novelId);
    if (!novel) {
      throw new NotFoundException('소설을 찾을 수 없습니다.');
    }

    const [recentEpisodesRaw, similarNovelsRaw, authorOtherNovelsRaw] = await Promise.all([
      this.novelRepository.findRecentEpisodes(novelId, 3),
      this.novelRepository.findSimilarNovels(novel.genreId, novelId, 6),
      this.novelRepository.findAuthorOtherNovels(novel.authorId, novelId, 6),
    ]);

    return {
      novel: toNovelObject(novel),
      recentEpisodes: recentEpisodesRaw.map(toEpisodeObject),
      similarNovels: similarNovelsRaw.map(toNovelObject),
      authorOtherNovels: authorOtherNovelsRaw.map(toNovelObject),
    };
  }

  // ──────────────────────────────────────────────
  // Episode CRUD
  // ──────────────────────────────────────────────

  async createEpisode(authorId: string, input: CreateEpisodeInput): Promise<EpisodeObject> {
    const novel = await this.novelRepository.findById(input.novelId);
    if (!novel) {
      throw new NotFoundException('소설을 찾을 수 없습니다.');
    }
    if (novel.authorId !== authorId) {
      throw new ForbiddenException('본인의 소설에만 회차를 등록할 수 있습니다.');
    }

    if (input.content.length < 500) {
      throw new BadRequestException('본문은 최소 500자 이상이어야 합니다.');
    }
    if (input.content.length > 50000) {
      throw new BadRequestException('본문은 최대 50,000자까지 가능합니다.');
    }

    if (!input.isFree && input.price === undefined) {
      throw new BadRequestException('유료 회차는 가격을 설정해야 합니다.');
    }

    const episodeNumber = await this.novelRepository.getNextEpisodeNumber(input.novelId);
    const wordCount = input.content.length;

    const episode = await this.novelRepository.createEpisode({
      novelId: input.novelId,
      authorId,
      episodeNumber,
      title: input.title,
      content: input.content,
      wordCount,
      isFree: input.isFree,
      price: input.isFree ? undefined : input.price,
    });

    await this.novelRepository.update(input.novelId, {
      totalEpisodes: { increment: 1 },
    });

    return toEpisodeObject(episode);
  }

  async updateEpisode(
    requesterId: string,
    episodeId: string,
    input: UpdateEpisodeInput,
  ): Promise<EpisodeObject> {
    const episode = await this.novelRepository.findEpisodeById(episodeId);
    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }
    if (episode.authorId !== requesterId) {
      throw new ForbiddenException('본인의 회차만 수정할 수 있습니다.');
    }

    // 발행 후 가격 변경 금지
    if (
      input.price !== undefined &&
      episode.status === EpisodeStatus.PUBLISHED &&
      episode.price !== input.price
    ) {
      throw new BadRequestException('발행된 회차의 가격은 변경할 수 없습니다.');
    }

    if (input.content !== undefined) {
      if (input.content.length < 500) {
        throw new BadRequestException('본문은 최소 500자 이상이어야 합니다.');
      }
      if (input.content.length > 50000) {
        throw new BadRequestException('본문은 최대 50,000자까지 가능합니다.');
      }
    }

    const wordCount = input.content !== undefined ? input.content.length : undefined;
    const isAlreadyPublished = episode.status === EpisodeStatus.PUBLISHED;

    const updated = await this.novelRepository.updateEpisode(episodeId, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(wordCount !== undefined && { wordCount }),
      ...(input.isFree !== undefined && { isFree: input.isFree }),
      ...(input.price !== undefined && { price: input.price }),
      ...(isAlreadyPublished && input.content !== undefined && {
        isEdited: true,
        editedAt: new Date(),
      }),
    });

    return toEpisodeObject(updated);
  }

  async deleteEpisode(requesterId: string, episodeId: string): Promise<boolean> {
    const episode = await this.novelRepository.findEpisodeById(episodeId);
    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }
    if (episode.authorId !== requesterId) {
      throw new ForbiddenException('본인의 회차만 삭제할 수 있습니다.');
    }

    await this.novelRepository.softDeleteEpisode(episodeId);
    await this.novelRepository.update(episode.novelId, {
      totalEpisodes: { decrement: 1 },
    });
    return true;
  }

  async publishEpisode(requesterId: string, episodeId: string): Promise<EpisodeObject> {
    const episode = await this.novelRepository.findEpisodeById(episodeId);
    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }
    if (episode.authorId !== requesterId) {
      throw new ForbiddenException('본인의 회차만 발행할 수 있습니다.');
    }
    if (episode.status === EpisodeStatus.PUBLISHED) {
      throw new BadRequestException('이미 발행된 회차입니다.');
    }

    // 유료 회차 발행 시 무료 회차 3개 이상 필요
    if (!episode.isFree) {
      const freeCount = await this.novelRepository.countPublishedFreeEpisodes(episode.novelId);
      if (freeCount < MIN_FREE_EPISODES_FOR_PAID) {
        throw new BadRequestException(
          `유료 회차를 발행하려면 먼저 무료 회차를 ${MIN_FREE_EPISODES_FOR_PAID}개 이상 발행해야 합니다. (현재 ${freeCount}개)`,
        );
      }
    }

    const updated = await this.novelRepository.updateEpisode(episodeId, {
      status: EpisodeStatus.PUBLISHED,
      publishedAt: new Date(),
      scheduledAt: null,
    });

    return toEpisodeObject(updated);
  }

  async scheduleEpisode(
    requesterId: string,
    episodeId: string,
    scheduledAt: Date,
  ): Promise<EpisodeObject> {
    const episode = await this.novelRepository.findEpisodeById(episodeId);
    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }
    if (episode.authorId !== requesterId) {
      throw new ForbiddenException('본인의 회차만 예약할 수 있습니다.');
    }
    if (episode.status === EpisodeStatus.PUBLISHED) {
      throw new BadRequestException('이미 발행된 회차는 예약할 수 없습니다.');
    }
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('예약 시간은 현재 시간 이후여야 합니다.');
    }

    const updated = await this.novelRepository.updateEpisode(episodeId, {
      status: EpisodeStatus.SCHEDULED,
      scheduledAt,
    });

    return toEpisodeObject(updated);
  }

  async cancelSchedule(requesterId: string, episodeId: string): Promise<EpisodeObject> {
    const episode = await this.novelRepository.findEpisodeById(episodeId);
    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }
    if (episode.authorId !== requesterId) {
      throw new ForbiddenException('본인의 회차만 예약을 취소할 수 있습니다.');
    }
    if (episode.status !== EpisodeStatus.SCHEDULED) {
      throw new BadRequestException('예약된 회차가 아닙니다.');
    }

    const updated = await this.novelRepository.updateEpisode(episodeId, {
      status: EpisodeStatus.DRAFT,
      scheduledAt: null,
    });

    return toEpisodeObject(updated);
  }

  async getEpisodes(
    novelId: string,
    status?: EpisodeStatus,
    first?: number,
    after?: string,
  ): Promise<EpisodeConnection> {
    const result = await this.novelRepository.findEpisodes(novelId, status, { first, after });

    const edges: EpisodeEdge[] = result.items.map((ep) => ({
      node: toEpisodeObject(ep),
      cursor: encodeCursor(ep.id),
    }));

    const pageInfo: PageInfo = {
      hasNextPage: result.hasNextPage,
      endCursor: result.endCursor ?? undefined,
    };

    return { edges, pageInfo, totalCount: result.totalCount };
  }

  async getEpisode(episodeId: string, userId?: string): Promise<EpisodeObject | null> {
    const episode = await this.novelRepository.findEpisodeById(episodeId);
    if (!episode) return null;

    // 유료 회차 접근 제어
    if (!episode.isFree && episode.status === EpisodeStatus.PUBLISHED) {
      const hasAccess = userId
        ? await this.paymentService.hasEpisodeAccess(userId, episodeId)
        : false;

      if (!hasAccess) {
        // 미구매: 200자 프리뷰만 반환
        const preview = episode.content.slice(0, PREVIEW_CONTENT_LENGTH) + '...';
        return toEpisodeObject({ ...episode, content: preview });
      }
    }

    return toEpisodeObject(episode);
  }

  // ──────────────────────────────────────────────
  // Serialization schedule
  // ──────────────────────────────────────────────

  async updateSerializationSchedule(
    requesterId: string,
    novelId: string,
    input: SerializationScheduleInput,
  ): Promise<SerializationScheduleObject> {
    const novel = await this.novelRepository.findById(novelId);
    if (!novel) {
      throw new NotFoundException('소설을 찾을 수 없습니다.');
    }
    if (novel.authorId !== requesterId) {
      throw new ForbiddenException('본인의 소설만 연재 일정을 설정할 수 있습니다.');
    }

    const schedule = await this.novelRepository.upsertSchedule(novelId, {
      type: input.type,
      serialDays: input.serialDays,
      serialCount: input.serialCount,
      preferredTime: input.preferredTime,
    });

    return {
      id: schedule.id,
      novelId: schedule.novelId,
      type: schedule.type,
      serialDays: schedule.serialDays,
      serialCount: schedule.serialCount ?? undefined,
      preferredTime: schedule.preferredTime ?? undefined,
      timezone: schedule.timezone,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  async getSerializationSchedule(novelId: string): Promise<SerializationScheduleObject | null> {
    const schedule = await this.novelRepository.findSchedule(novelId);
    if (!schedule) return null;
    return {
      id: schedule.id,
      novelId: schedule.novelId,
      type: schedule.type,
      serialDays: schedule.serialDays,
      serialCount: schedule.serialCount ?? undefined,
      preferredTime: schedule.preferredTime ?? undefined,
      timezone: schedule.timezone,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  // ──────────────────────────────────────────────
  // Drafts
  // ──────────────────────────────────────────────

  async saveDraft(authorId: string, input: SaveDraftInput): Promise<DraftObject> {
    const draft = await this.novelRepository.upsertDraft({
      novelId: input.novelId,
      authorId,
      episodeId: input.episodeId,
      title: input.title,
      content: input.content,
    });
    return this.toDraftObject(draft);
  }

  async autoSaveDraft(authorId: string, input: SaveDraftInput): Promise<DraftObject> {
    const draft = await this.novelRepository.upsertDraft({
      novelId: input.novelId,
      authorId,
      episodeId: input.episodeId,
      title: input.title,
      content: input.content,
    });
    return this.toDraftObject(draft);
  }

  async getDrafts(authorId: string, novelId?: string): Promise<DraftObject[]> {
    const drafts = await this.novelRepository.findDrafts(authorId, novelId);
    return drafts.map((d) => this.toDraftObject(d));
  }

  // ──────────────────────────────────────────────
  // Reading progress
  // ──────────────────────────────────────────────

  async saveReadingProgress(
    userId: string,
    input: ReadingProgressInput,
  ): Promise<ReadingProgressObject> {
    const episode = await this.novelRepository.findEpisodeById(input.episodeId);
    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }

    const progress = await this.novelRepository.upsertReadingProgress({
      userId,
      novelId: input.novelId,
      lastEpisodeId: input.episodeId,
      lastEpisodeNumber: episode.episodeNumber,
      scrollPosition: input.scrollPosition,
    });

    return {
      novelId: progress.novelId,
      lastEpisodeId: progress.lastEpisodeId,
      lastEpisodeNumber: progress.lastEpisodeNumber,
      scrollPosition: progress.scrollPosition ?? undefined,
      lastReadAt: progress.lastReadAt,
    };
  }

  async getReadingProgress(
    userId: string,
    novelId: string,
  ): Promise<ReadingProgressObject | null> {
    const progress = await this.novelRepository.findReadingProgress(userId, novelId);
    if (!progress) return null;
    return {
      novelId: progress.novelId,
      lastEpisodeId: progress.lastEpisodeId,
      lastEpisodeNumber: progress.lastEpisodeNumber,
      scrollPosition: progress.scrollPosition ?? undefined,
      lastReadAt: progress.lastReadAt,
    };
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private toDraftObject(draft: {
    id: string;
    episodeId?: string | null;
    novelId: string;
    authorId: string;
    title?: string | null;
    content?: string | null;
    lastSyncedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): DraftObject {
    return {
      id: draft.id,
      episodeId: draft.episodeId ?? undefined,
      novelId: draft.novelId,
      authorId: draft.authorId,
      title: draft.title ?? undefined,
      content: draft.content ?? undefined,
      lastSyncedAt: draft.lastSyncedAt ?? undefined,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  }
}
