import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RankingType, RankingPeriod } from '@prisma/client';
import { DiscoveryRepository } from '../infrastructure/discovery.repository';
import { PaginationParams } from '../../../common/types/pagination';

import {
  SearchResultObject,
  NovelSummaryConnection,
  NovelSummaryObject,
  RankingObject,
  RecommendationObject,
  PopularSearchTermObject,
} from './dto/discovery.object';
import {
  SearchFiltersInput,
  GenreFiltersInput,
  SearchSort,
  NovelSort,
} from './dto/discovery.input';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const MIN_SEARCH_LENGTH = 2;
const DEFAULT_LIMIT = 20;
const MAX_SUGGESTIONS = 10;

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

@Injectable()
export class DiscoveryService {
  constructor(private readonly discoveryRepository: DiscoveryRepository) {}

  // ──────────────────────────────────────────────
  // Search
  // ──────────────────────────────────────────────

  async searchNovels(
    query: string,
    filters?: SearchFiltersInput,
    sort?: SearchSort,
    pagination?: PaginationParams,
  ): Promise<SearchResultObject> {
    // Validate query
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      throw new BadRequestException(
        `검색어는 최소 ${MIN_SEARCH_LENGTH}자 이상이어야 합니다.`,
      );
    }

    const trimmedQuery = query.trim();

    // Record search keyword for analytics
    await this.discoveryRepository.incrementSearchKeyword(trimmedQuery, 'daily');

    // Search novels
    const result = await this.discoveryRepository.searchNovels(
      trimmedQuery,
      filters,
      sort,
      pagination?.first || DEFAULT_LIMIT,
      pagination?.after,
    );

    return result as unknown as SearchResultObject;
  }

  async searchSuggestions(query: string): Promise<string[]> {
    // Return empty array if query is too short
    if (!query || query.trim().length < MIN_SEARCH_LENGTH) {
      return [];
    }

    // Fetch from searchNovels with minimal filters to get suggestions
    const trimmedQuery = query.trim();
    const result = await this.discoveryRepository.searchNovels(
      trimmedQuery,
      undefined,
      undefined,
      MAX_SUGGESTIONS,
      undefined,
    );

    // Extract suggestions from novels found
    return result.novels.map((n) => n.authorName).slice(0, MAX_SUGGESTIONS);
  }

  // ──────────────────────────────────────────────
  // Genre
  // ──────────────────────────────────────────────

  async novelsByGenre(
    genreId: string,
    sort?: NovelSort,
    filters?: GenreFiltersInput,
    pagination?: PaginationParams,
  ): Promise<NovelSummaryConnection> {
    // Genre existence check is assumed to be handled by repository
    const result = await this.discoveryRepository.findNovelsByGenre(
      genreId,
      sort,
      filters,
      pagination?.first || DEFAULT_LIMIT,
      pagination?.after,
    );

    return result as unknown as NovelSummaryConnection;
  }

  // ──────────────────────────────────────────────
  // Ranking
  // ──────────────────────────────────────────────

  async ranking(
    type: RankingType,
    period: RankingPeriod,
    genreId?: string,
    limit?: number,
  ): Promise<RankingObject> {
    const result = await this.discoveryRepository.findRankings(
      type,
      period,
      genreId,
      limit || DEFAULT_LIMIT,
    );

    if (!result) {
      throw new NotFoundException('랭킹 데이터를 찾을 수 없습니다.');
    }

    return result as unknown as RankingObject;
  }

  async trendingNovels(limit?: number): Promise<NovelSummaryObject[]> {
    const result = await this.discoveryRepository.findTrendingNovels(
      limit || DEFAULT_LIMIT,
    );

    return result as unknown as NovelSummaryObject[];
  }

  async newReleases(
    genreId?: string,
    limit?: number,
  ): Promise<NovelSummaryObject[]> {
    const result = await this.discoveryRepository.findNewReleases(
      genreId,
      limit || DEFAULT_LIMIT,
    );

    return result as unknown as NovelSummaryObject[];
  }

  // ──────────────────────────────────────────────
  // Recommendation
  // ──────────────────────────────────────────────

  async personalizedRecommendations(
    userId: string,
    limit?: number,
  ): Promise<RecommendationObject[]> {
    const result = await this.discoveryRepository.findPersonalizedRecommendations(
      userId,
      limit || DEFAULT_LIMIT,
    );

    return result as unknown as RecommendationObject[];
  }

  async similarNovels(
    novelId: string,
    limit?: number,
  ): Promise<RecommendationObject[]> {
    const result = await this.discoveryRepository.findSimilarNovels(
      novelId,
      limit || DEFAULT_LIMIT,
    );

    return result as unknown as RecommendationObject[];
  }

  // ──────────────────────────────────────────────
  // Popular Search Terms
  // ──────────────────────────────────────────────

  async popularSearchTerms(limit?: number): Promise<PopularSearchTermObject[]> {
    const result = await this.discoveryRepository.findPopularSearchTerms(
      'daily',
      limit || DEFAULT_LIMIT,
    );

    return result as unknown as PopularSearchTermObject[];
  }

  // ──────────────────────────────────────────────
  // View Recording
  // ──────────────────────────────────────────────

  async recordEpisodeView(
    episodeId: string,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.discoveryRepository.recordView(
      episodeId,
      ipAddress || '0.0.0.0',
      userId,
      sessionId,
      userAgent,
    );
  }
}
