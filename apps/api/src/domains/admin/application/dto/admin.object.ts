import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AdminActionType, BadgeType } from '@prisma/client';
import { NoticeCategoryEnum } from './admin.input';

// ──────────────────────────────────────────────
// Page Info (재사용)
// ──────────────────────────────────────────────

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field({ nullable: true })
  endCursor?: string;
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

@ObjectType()
export class AdminDashboardObject {
  @Field(() => Int)
  pendingReports: number;

  @Field(() => Int)
  todayNewUsers: number;

  @Field(() => Int)
  todayNewNovels: number;

  @Field(() => Int)
  todayRevenue: number;

  @Field(() => Int)
  activeUsers: number;
}

// ──────────────────────────────────────────────
// Content Review
// ──────────────────────────────────────────────

@ObjectType()
export class ContentReviewObject {
  @Field(() => ID)
  id: string;

  @Field()
  targetType: string;

  @Field()
  targetId: string;

  @Field(() => AdminActionType)
  action: AdminActionType;

  @Field()
  reason: string;

  @Field()
  adminId: string;

  @Field()
  createdAt: Date;
}

// ──────────────────────────────────────────────
// User Penalty
// ──────────────────────────────────────────────

@ObjectType()
export class UserPenaltyObject {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => AdminActionType)
  action: AdminActionType;

  @Field()
  reason: string;

  @Field({ nullable: true })
  duration?: string;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field()
  createdAt: Date;
}

// ──────────────────────────────────────────────
// Notice
// ──────────────────────────────────────────────

@ObjectType()
export class NoticeObject {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => NoticeCategoryEnum)
  category: NoticeCategoryEnum;

  @Field()
  isPinned: boolean;

  @Field()
  isPublished: boolean;

  @Field({ nullable: true })
  publishedAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class NoticeEdge {
  @Field(() => NoticeObject)
  node: NoticeObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class NoticeConnection {
  @Field(() => [NoticeEdge])
  edges: NoticeEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ──────────────────────────────────────────────
// User Badge
// ──────────────────────────────────────────────

@ObjectType()
export class UserBadgeObject {
  @Field(() => ID)
  id: string;

  @Field()
  targetType: string; // "USER" | "NOVEL"

  @Field()
  targetId: string;

  @Field(() => BadgeType)
  badgeType: BadgeType;

  @Field({ nullable: true })
  customName?: string;

  @Field()
  reason: string;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}

// ──────────────────────────────────────────────
// Report (Content 도메인과 연동)
// ──────────────────────────────────────────────

@ObjectType()
export class ReportObject {
  @Field(() => ID)
  id: string;

  @Field()
  targetType: string;

  @Field()
  targetId: string;

  @Field()
  reason: string;

  @Field()
  status: string;

  @Field()
  reporterId: string;

  @Field({ nullable: true })
  adminNote?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ReportEdge {
  @Field(() => ReportObject)
  node: ReportObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class ReportConnection {
  @Field(() => [ReportEdge])
  edges: ReportEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
