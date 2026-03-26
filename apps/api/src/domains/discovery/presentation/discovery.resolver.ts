import { Args, ID, Int, Query, Resolver, Mutation } from '@nestjs/graphql';
import { UseGuards, Optional } from '@nestjs/common';
import { RankingType, RankingPeriod } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../../common/types/context';
import { DiscoveryService } from '../application/discovery.service';
import {
  SearchResultObject,
  NovelSummaryConnection,
  NovelSummaryObject,
  RankingObject,
  RecommendationObject,
  PopularSearchTermObject,
} from '../application/dto/discovery.object';
import {
  SearchFiltersInput,
  GenreFiltersInput,
  SearchSort,
  NovelSort,
} from '../application/dto/discovery.input';

@Resolver()
export class DiscoveryResolver {
  constructor(private readonly discoveryService: DiscoveryService) {}

  // ──────────────────────────────────────────────
  // Search Queries
  // ──────────────────────────────────────────────

  @Query(() => SearchResultObject, { name: 'searchNovels' })
  async searchNovels(
    @Args('query') query: string,
    @Args('filters', { nullable: true }) filters?: SearchFiltersInput,
    @Args('sort', { type: () => SearchSort, nullable: true })
    sort?: SearchSort,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 })
    first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<SearchResultObject> {
    return this.discoveryService.searchNovels(query, filters, sort, {
      first,
      after,
    });
  }

  @Query(() => [String], { name: 'searchSuggestions' })
  async searchSuggestions(
    @Args('query') query: string,
  ): Promise<string[]> {
    return this.discoveryService.searchSuggestions(query);
  }

  @Query(() => [PopularSearchTermObject], { name: 'popularSearchTerms' })
  async popularSearchTerms(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<PopularSearchTermObject[]> {
    return this.discoveryService.popularSearchTerms(limit);
  }

  // ──────────────────────────────────────────────
  // Genre Queries
  // ──────────────────────────────────────────────

  @Query(() => NovelSummaryConnection, { name: 'novelsByGenre' })
  async novelsByGenre(
    @Args('genreId', { type: () => ID }) genreId: string,
    @Args('sort', { type: () => NovelSort, nullable: true })
    sort?: NovelSort,
    @Args('filters', { nullable: true }) filters?: GenreFiltersInput,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 })
    first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<NovelSummaryConnection> {
    return this.discoveryService.novelsByGenre(genreId, sort, filters, {
      first,
      after,
    });
  }

  // ──────────────────────────────────────────────
  // Ranking Queries
  // ──────────────────────────────────────────────

  @Query(() => RankingObject, { name: 'ranking' })
  async ranking(
    @Args('type', { type: () => RankingType }) type: RankingType,
    @Args('period', { type: () => RankingPeriod }) period: RankingPeriod,
    @Args('genreId', { type: () => ID, nullable: true }) genreId?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 })
    limit?: number,
  ): Promise<RankingObject> {
    return this.discoveryService.ranking(type, period, genreId, limit);
  }

  @Query(() => [NovelSummaryObject], { name: 'trendingNovels' })
  async trendingNovels(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<NovelSummaryObject[]> {
    return this.discoveryService.trendingNovels(limit);
  }

  @Query(() => [NovelSummaryObject], { name: 'newReleases' })
  async newReleases(
    @Args('genreId', { type: () => ID, nullable: true }) genreId?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<NovelSummaryObject[]> {
    return this.discoveryService.newReleases(genreId, limit);
  }

  // ──────────────────────────────────────────────
  // Recommendation Queries
  // ──────────────────────────────────────────────

  @Query(() => [RecommendationObject], { name: 'personalizedRecommendations' })
  @UseGuards(JwtAuthGuard)
  async personalizedRecommendations(
    @CurrentUser() user: JwtPayload,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<RecommendationObject[]> {
    return this.discoveryService.personalizedRecommendations(user.userId, limit);
  }

  @Query(() => [RecommendationObject], { name: 'similarNovels' })
  async similarNovels(
    @Args('novelId', { type: () => ID }) novelId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit?: number,
  ): Promise<RecommendationObject[]> {
    return this.discoveryService.similarNovels(novelId, limit);
  }

  // ──────────────────────────────────────────────
  // View Mutation
  // ──────────────────────────────────────────────

  @Mutation(() => Boolean, { name: 'recordEpisodeView' })
  async recordEpisodeView(
    @Args('episodeId', { type: () => ID }) episodeId: string,
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @Args('ipAddress', { nullable: true }) ipAddress?: string,
    @Args('userAgent', { nullable: true }) userAgent?: string,
    @CurrentUser({ required: false }) user?: JwtPayload,
  ): Promise<boolean> {
    try {
      await this.discoveryService.recordEpisodeView(
        episodeId,
        user?.userId,
        sessionId,
        ipAddress,
        userAgent,
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
