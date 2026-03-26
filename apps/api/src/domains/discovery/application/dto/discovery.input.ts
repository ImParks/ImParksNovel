import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NovelStatus } from '@prisma/client';

// ──────────────────────────────────────────────
// Sort Enums (re-export from object types)
// ──────────────────────────────────────────────

export enum SearchSort {
  RELEVANCE = 'RELEVANCE',
  LATEST = 'LATEST',
  VIEWS = 'VIEWS',
  LIKES = 'LIKES',
  BOOKMARKS = 'BOOKMARKS',
}

export enum NovelSort {
  LATEST = 'LATEST',
  VIEWS = 'VIEWS',
  LIKES = 'LIKES',
  BOOKMARKS = 'BOOKMARKS',
}

registerEnumType(SearchSort, { name: 'SearchSort' });
registerEnumType(NovelSort, { name: 'NovelSort' });

// ──────────────────────────────────────────────
// Search Filters
// ──────────────────────────────────────────────

@InputType()
export class SearchFiltersInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genreIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @Field(() => NovelStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NovelStatus)
  status?: NovelStatus;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isAdultOnly?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minEpisodes?: number;
}

// ──────────────────────────────────────────────
// Genre Filters
// ──────────────────────────────────────────────

@InputType()
export class GenreFiltersInput {
  @Field(() => NovelStatus, { nullable: true })
  @IsOptional()
  @IsEnum(NovelStatus)
  status?: NovelStatus;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minEpisodes?: number;
}
