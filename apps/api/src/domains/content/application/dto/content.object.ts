import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { ReportStatus } from '@prisma/client';

registerEnumType(ReportStatus, { name: 'ReportStatus' });

// ---------------------------------------------------------------------------
// PageInfo (shared cursor pagination)
// ---------------------------------------------------------------------------

@ObjectType()
export class ContentPageInfo {
  @Field()
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor?: string;
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

@ObjectType()
export class CommentObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  episodeId: string;

  @Field()
  content: string;

  @Field()
  isSpoiler: boolean;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => Int)
  depth: number;

  @Field()
  isPinned: boolean;

  @Field()
  isEdited: boolean;

  @Field(() => Date, { nullable: true })
  editedAt?: Date;

  @Field(() => Int)
  likeCount: number;

  @Field()
  isHidden: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  @Field(() => [CommentObject])
  replies: CommentObject[];
}

@ObjectType()
export class CommentEdge {
  @Field()
  cursor: string;

  @Field(() => CommentObject)
  node: CommentObject;
}

@ObjectType()
export class CommentConnection {
  @Field(() => [CommentEdge])
  edges: CommentEdge[];

  @Field(() => ContentPageInfo)
  pageInfo: ContentPageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Like / Dislike results
// ---------------------------------------------------------------------------

@ObjectType()
export class LikeResult {
  @Field()
  isLiked: boolean;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class DislikeResult {
  @Field()
  isDisliked: boolean;

  @Field(() => Int)
  count: number;
}

// ---------------------------------------------------------------------------
// Bookmark
// ---------------------------------------------------------------------------

@ObjectType()
export class BookmarkObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  novelId: string;

  @Field()
  notifyNewEpisode: boolean;

  @Field(() => ID, { nullable: true })
  folderId?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class BookmarkResult {
  @Field()
  isBookmarked: boolean;
}

@ObjectType()
export class BookmarkEdge {
  @Field()
  cursor: string;

  @Field(() => BookmarkObject)
  node: BookmarkObject;
}

@ObjectType()
export class BookmarkConnection {
  @Field(() => [BookmarkEdge])
  edges: BookmarkEdge[];

  @Field(() => ContentPageInfo)
  pageInfo: ContentPageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Favorite
// ---------------------------------------------------------------------------

@ObjectType()
export class FavoriteObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  novelId: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class FavoriteResult {
  @Field()
  isFavorited: boolean;
}

@ObjectType()
export class FavoriteEdge {
  @Field()
  cursor: string;

  @Field(() => FavoriteObject)
  node: FavoriteObject;
}

@ObjectType()
export class FavoriteConnection {
  @Field(() => [FavoriteEdge])
  edges: FavoriteEdge[];

  @Field(() => ContentPageInfo)
  pageInfo: ContentPageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ---------------------------------------------------------------------------
// ReadingHistory
// ---------------------------------------------------------------------------

@ObjectType()
export class ReadingHistoryObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  novelId: string;

  @Field(() => ID)
  lastEpisodeId: string;

  @Field(() => Int)
  lastEpisodeNumber: number;

  @Field(() => Number, { nullable: true })
  scrollPosition?: number;

  @Field()
  lastReadAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ReadingHistoryEdge {
  @Field()
  cursor: string;

  @Field(() => ReadingHistoryObject)
  node: ReadingHistoryObject;
}

@ObjectType()
export class ReadingHistoryConnection {
  @Field(() => [ReadingHistoryEdge])
  edges: ReadingHistoryEdge[];

  @Field(() => ContentPageInfo)
  pageInfo: ContentPageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

@ObjectType()
export class ReportObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  reporterId: string;

  @Field()
  targetType: string;

  @Field(() => ID)
  targetId: string;

  @Field()
  reason: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => ReportStatus)
  status: ReportStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
