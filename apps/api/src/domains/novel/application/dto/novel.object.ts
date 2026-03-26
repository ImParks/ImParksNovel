import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { EpisodeStatus, NovelStatus, SerializationType } from '@prisma/client';

// ──────────────────────────────────────────────
// NovelObject
// ──────────────────────────────────────────────

@ObjectType()
export class NovelObject {
  @Field(() => ID)
  id: string;

  @Field()
  authorId: string;

  @Field()
  title: string;

  @Field()
  synopsis: string;

  @Field(() => String, { nullable: true })
  coverImageUrl?: string;

  @Field()
  genreId: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => NovelStatus)
  status: NovelStatus;

  @Field()
  isAdultOnly: boolean;

  @Field(() => Int)
  totalEpisodes: number;

  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalDislikes: number;

  @Field(() => Int)
  totalBookmarks: number;

  @Field(() => Int)
  totalFavorites: number;

  @Field(() => Int)
  totalSupports: number;

  @Field(() => Float, { nullable: true })
  aiContributionRatio?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// EpisodeObject
// ──────────────────────────────────────────────

@ObjectType()
export class EpisodeObject {
  @Field(() => ID)
  id: string;

  @Field()
  novelId: string;

  @Field()
  authorId: string;

  @Field(() => Int)
  episodeNumber: number;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => Int)
  wordCount: number;

  @Field(() => EpisodeStatus)
  status: EpisodeStatus;

  @Field()
  isFree: boolean;

  @Field(() => Int, { nullable: true })
  price?: number;

  @Field(() => Int)
  viewCount: number;

  @Field(() => Int)
  likeCount: number;

  @Field(() => Int)
  dislikeCount: number;

  @Field(() => Int)
  recommendCount: number;

  @Field(() => Int)
  commentCount: number;

  @Field(() => Date, { nullable: true })
  scheduledAt?: Date;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date;

  @Field()
  isEdited: boolean;

  @Field(() => Date, { nullable: true })
  editedAt?: Date;

  @Field(() => Float, { nullable: true })
  aiContributionRatio?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// NovelDetailObject
// ──────────────────────────────────────────────

@ObjectType()
export class NovelDetailObject {
  @Field(() => NovelObject)
  novel: NovelObject;

  @Field(() => [EpisodeObject])
  recentEpisodes: EpisodeObject[];

  @Field(() => [NovelObject])
  similarNovels: NovelObject[];

  @Field(() => [NovelObject])
  authorOtherNovels: NovelObject[];
}

// ──────────────────────────────────────────────
// DraftObject
// ──────────────────────────────────────────────

@ObjectType()
export class DraftObject {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  episodeId?: string;

  @Field()
  novelId: string;

  @Field()
  authorId: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  content?: string;

  @Field(() => Date, { nullable: true })
  lastSyncedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// SerializationScheduleObject
// ──────────────────────────────────────────────

@ObjectType()
export class SerializationScheduleObject {
  @Field(() => ID)
  id: string;

  @Field()
  novelId: string;

  @Field(() => SerializationType)
  type: SerializationType;

  @Field(() => [String])
  serialDays: string[];

  @Field(() => Int, { nullable: true })
  serialCount?: number;

  @Field(() => String, { nullable: true })
  preferredTime?: string;

  @Field()
  timezone: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// ReadingProgressObject
// ──────────────────────────────────────────────

@ObjectType()
export class ReadingProgressObject {
  @Field()
  novelId: string;

  @Field()
  lastEpisodeId: string;

  @Field(() => Int)
  lastEpisodeNumber: number;

  @Field(() => Float, { nullable: true })
  scrollPosition?: number;

  @Field()
  lastReadAt: Date;
}

// ──────────────────────────────────────────────
// Cursor Pagination: Novel
// ──────────────────────────────────────────────

@ObjectType()
export class NovelEdge {
  @Field(() => NovelObject)
  node: NovelObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor?: string;
}

@ObjectType()
export class NovelConnection {
  @Field(() => [NovelEdge])
  edges: NovelEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ──────────────────────────────────────────────
// Cursor Pagination: Episode
// ──────────────────────────────────────────────

@ObjectType()
export class EpisodeEdge {
  @Field(() => EpisodeObject)
  node: EpisodeObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class EpisodeConnection {
  @Field(() => [EpisodeEdge])
  edges: EpisodeEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
