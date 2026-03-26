import { InputType, Field, Int, Float, registerEnumType } from '@nestjs/graphql';
import {
  EpisodeStatus,
  NovelStatus,
  SerializationType,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

registerEnumType(NovelStatus, { name: 'NovelStatus' });
registerEnumType(EpisodeStatus, { name: 'EpisodeStatus' });
registerEnumType(SerializationType, { name: 'SerializationType' });

// ──────────────────────────────────────────────
// Novel inputs
// ──────────────────────────────────────────────

@InputType()
export class CreateNovelInput {
  @Field()
  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다.' })
  title: string;

  @Field()
  @IsString()
  @MinLength(1, { message: '시놉시스를 입력해주세요.' })
  @MaxLength(2000, { message: '시놉시스는 최대 2000자까지 가능합니다.' })
  synopsis: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다.' })
  coverImageUrl?: string;

  @Field()
  @IsString()
  genreId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @Field()
  @IsBoolean()
  isAdultOnly: boolean;
}

@InputType()
export class UpdateNovelInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  synopsis?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다.' })
  coverImageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  genreId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAdultOnly?: boolean;
}

// ──────────────────────────────────────────────
// Episode inputs
// ──────────────────────────────────────────────

@InputType()
export class CreateEpisodeInput {
  @Field()
  @IsString()
  novelId: string;

  @Field()
  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(200, { message: '제목은 최대 200자까지 가능합니다.' })
  title: string;

  @Field()
  @IsString()
  @MinLength(500, { message: '본문은 최소 500자 이상이어야 합니다.' })
  @MaxLength(50000, { message: '본문은 최대 50,000자까지 가능합니다.' })
  content: string;

  @Field()
  @IsBoolean()
  isFree: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1, { message: '가격은 최소 1코인입니다.' })
  @Max(10, { message: '가격은 최대 10코인입니다.' })
  price?: number;
}

@InputType()
export class UpdateEpisodeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(500, { message: '본문은 최소 500자 이상이어야 합니다.' })
  @MaxLength(50000, { message: '본문은 최대 50,000자까지 가능합니다.' })
  content?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  price?: number;
}

// ──────────────────────────────────────────────
// Serialization schedule input
// ──────────────────────────────────────────────

@InputType()
export class SerializationScheduleInput {
  @Field(() => SerializationType)
  type: SerializationType;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialDays?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  serialCount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preferredTime?: string;
}

// ──────────────────────────────────────────────
// Draft input
// ──────────────────────────────────────────────

@InputType()
export class SaveDraftInput {
  @Field()
  @IsString()
  novelId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  episodeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;
}

// ──────────────────────────────────────────────
// Reading progress input
// ──────────────────────────────────────────────

@InputType()
export class ReadingProgressInput {
  @Field()
  @IsString()
  novelId: string;

  @Field()
  @IsString()
  episodeId: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  scrollPosition?: number;
}
