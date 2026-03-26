import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NovelStatus, RankingType, RankingPeriod } from '@prisma/client';
import { PageInfo } from '../../../novel/application/dto/novel.object';

// ──────────────────────────────────────────────
// Enum registration
// ──────────────────────────────────────────────

registerEnumType(RankingType, { name: 'RankingType' });
registerEnumType(RankingPeriod, { name: 'RankingPeriod' });

// ──────────────────────────────────────────────
// Novel Summary (for list display)
// ──────────────────────────────────────────────

@ObjectType()
export class NovelSummaryObject {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  synopsis: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field()
  authorName: string;

  @Field()
  genreName: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => NovelStatus)
  status: NovelStatus;

  @Field(() => Int)
  totalEpisodes: number;

  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalBookmarks: number;

  @Field()
  isAdultOnly: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class NovelSummaryEdge {
  @Field(() => NovelSummaryObject)
  node: NovelSummaryObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class NovelSummaryConnection {
  @Field(() => [NovelSummaryEdge])
  edges: NovelSummaryEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ──────────────────────────────────────────────
// Search Result
// ──────────────────────────────────────────────

@ObjectType()
export class SearchResultObject {
  @Field(() => NovelSummaryConnection)
  novels: NovelSummaryConnection;

  @Field(() => Int)
  totalCount: number;

  @Field(() => [String], { nullable: true })
  suggestions?: string[];
}

// ──────────────────────────────────────────────
// Ranking Entry
// ──────────────────────────────────────────────

@ObjectType()
export class RankingEntryObject {
  @Field(() => Int)
  rank: number;

  @Field(() => Int, { nullable: true })
  previousRank?: number;

  @Field(() => Int, { nullable: true })
  rankChange?: number;

  @Field(() => NovelSummaryObject)
  novel: NovelSummaryObject;

  @Field(() => Float)
  score: number;
}

// ──────────────────────────────────────────────
// Ranking
// ──────────────────────────────────────────────

@ObjectType()
export class RankingObject {
  @Field(() => RankingType)
  type: RankingType;

  @Field(() => RankingPeriod)
  period: RankingPeriod;

  @Field({ nullable: true })
  genre?: string;

  @Field(() => [RankingEntryObject])
  entries: RankingEntryObject[];

  @Field()
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// Recommendation
// ──────────────────────────────────────────────

@ObjectType()
export class RecommendationObject {
  @Field(() => NovelSummaryObject)
  novel: NovelSummaryObject;

  @Field(() => Float)
  score: number;

  @Field()
  reason: string;
}

// ──────────────────────────────────────────────
// Popular Search Term
// ──────────────────────────────────────────────

@ObjectType()
export class PopularSearchTermObject {
  @Field(() => Int)
  rank: number;

  @Field()
  term: string;

  @Field()
  isNew: boolean;

  @Field()
  isRising: boolean;
}
