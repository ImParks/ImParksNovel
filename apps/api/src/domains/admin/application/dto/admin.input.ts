import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { AdminActionType, BadgeType } from '@prisma/client';

// ──────────────────────────────────────────────
// Enum registration
// ──────────────────────────────────────────────

registerEnumType(AdminActionType, { name: 'AdminActionType' });
registerEnumType(BadgeType, { name: 'BadgeType' });

// ──────────────────────────────────────────────
// Notice Category enum
// ──────────────────────────────────────────────

export enum NoticeCategoryEnum {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  UPDATE = 'UPDATE',
  MAINTENANCE = 'MAINTENANCE',
  EVENT = 'EVENT',
  POLICY = 'POLICY',
}

registerEnumType(NoticeCategoryEnum, { name: 'NoticeCategory' });

// ──────────────────────────────────────────────
// Content Action (콘텐츠 조치)
// ──────────────────────────────────────────────

@InputType()
export class ContentActionInput {
  @Field()
  @IsString()
  targetType: string; // "NOVEL" | "EPISODE" | "COMMENT"

  @Field()
  @IsString()
  targetId: string;

  @Field(() => AdminActionType)
  action: AdminActionType; // CONTENT_HIDE, CONTENT_DELETE, WARNING, etc.

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

// ──────────────────────────────────────────────
// User Action (사용자 제재)
// ──────────────────────────────────────────────

@InputType()
export class UserActionInput {
  @Field()
  @IsString()
  userId: string;

  @Field(() => AdminActionType)
  action: AdminActionType; // WARNING, SUSPEND_1D, SUSPEND_7D, SUSPEND_30D, PERMANENT_BAN

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  duration?: string; // "1d", "7d", "30d"
}

// ──────────────────────────────────────────────
// Report Resolution
// ──────────────────────────────────────────────

@InputType()
export class ReportResolutionInput {
  @Field()
  @IsString()
  status: string; // "REVIEWED", "RESOLVED", "DISMISSED"

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

// ──────────────────────────────────────────────
// Notice Input
// ──────────────────────────────────────────────

@InputType()
export class CreateNoticeInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @Field()
  @IsString()
  @MinLength(1)
  content: string;

  @Field(() => NoticeCategoryEnum)
  category: NoticeCategoryEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  targetRoles?: string[]; // 빈 배열 = 전체
}

@InputType()
export class UpdateNoticeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @Field(() => NoticeCategoryEnum, { nullable: true })
  @IsOptional()
  category?: NoticeCategoryEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  targetRoles?: string[];
}

// ──────────────────────────────────────────────
// Badge Award
// ──────────────────────────────────────────────

@InputType()
export class AwardBadgeInput {
  @Field()
  @IsString()
  targetType: string; // "USER" | "NOVEL"

  @Field()
  @IsString()
  targetId: string;

  @Field(() => BadgeType)
  badgeType: BadgeType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customName?: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ──────────────────────────────────────────────
// Change User Role
// ──────────────────────────────────────────────

@InputType()
export class ChangeUserRoleInput {
  @Field()
  @IsString()
  userId: string;

  @Field()
  @IsString()
  role: string; // "READER", "AUTHOR", "ADMIN", "SUPER_ADMIN"
}
