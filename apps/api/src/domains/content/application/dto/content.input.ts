import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  DislikeTargetType,
  LikeTargetType,
  ReportTargetType,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum CommentOrderBy {
  CREATED_AT_DESC = 'CREATED_AT_DESC',
  LIKE_COUNT_DESC = 'LIKE_COUNT_DESC',
}

registerEnumType(CommentOrderBy, { name: 'CommentOrderBy' });
registerEnumType(LikeTargetType, { name: 'LikeTargetType' });
registerEnumType(DislikeTargetType, { name: 'DislikeTargetType' });
registerEnumType(ReportTargetType, { name: 'ReportTargetType' });

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

@InputType()
export class CreateCommentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  episodeId: string;

  @Field()
  @IsString()
  @MinLength(1, { message: '댓글은 최소 1자 이상이어야 합니다.' })
  @MaxLength(1000, { message: '댓글은 최대 1000자까지 가능합니다.' })
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  isSpoiler?: boolean;
}

@InputType()
export class CreateReplyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @Field()
  @IsString()
  @MinLength(1, { message: '대댓글은 최소 1자 이상이어야 합니다.' })
  @MaxLength(1000, { message: '대댓글은 최대 1000자까지 가능합니다.' })
  content: string;
}

@InputType()
export class ReportInput {
  @Field(() => ReportTargetType)
  targetType: ReportTargetType;

  @Field()
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
