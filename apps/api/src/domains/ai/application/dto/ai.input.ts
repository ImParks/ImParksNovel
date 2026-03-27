import { Field, InputType, Int, ID } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, Min, Max, MaxLength, IsEnum, IsUUID, IsArray } from 'class-validator';

// ──────────────────────────────────────────────
// REST Request DTOs (SSE용 Body 타입)
// ──────────────────────────────────────────────

export class ContinueWritingDto {
  @IsUUID()
  novelId: string;

  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @IsString()
  @MaxLength(5000)
  context: string;

  @IsString()
  @MaxLength(2000)
  prompt: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(5000)
  maxTokens?: number;

  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  settingNoteIds?: string[];
}

export class ImproveTextDto {
  @IsString()
  @MaxLength(10000)
  text: string;

  @IsEnum(['CONCISE', 'DESCRIPTIVE', 'DRAMATIC', 'FORMAL', 'CASUAL'])
  style: 'CONCISE' | 'DESCRIPTIVE' | 'DRAMATIC' | 'FORMAL' | 'CASUAL';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;
}

export class GenerateSettingDto {
  @IsEnum(['CHARACTER', 'WORLDVIEW', 'PLOT'])
  type: 'CHARACTER' | 'WORLDVIEW' | 'PLOT';

  @IsString()
  @MaxLength(2000)
  prompt: string;

  @IsUUID()
  novelId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  existingSettingIds?: string[];
}

export class SuggestPlotDto {
  @IsUUID()
  novelId: string;

  @IsString()
  @MaxLength(5000)
  currentPlot: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  direction?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  settingNoteIds?: string[];
}

// ──────────────────────────────────────────────
// GraphQL InputType
// ──────────────────────────────────────────────

@InputType()
export class CreateSettingNoteInput {
  @Field()
  @IsUUID()
  novelId: string;

  @Field()
  @IsString()
  @MaxLength(50)
  category: string;

  @Field()
  @IsString()
  @MaxLength(200)
  title: string;

  @Field()
  @IsString()
  @MaxLength(5000)
  content: string;
}

@InputType()
export class UpdateSettingNoteInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;
}

// ──────────────────────────────────────────────
// Episode Plan InputType
// ──────────────────────────────────────────────

@InputType()
export class SuggestEpisodeDivisionInput {
  @Field(() => String)
  @IsString()
  @IsUUID()
  novelId: string;

  @Field()
  @IsString()
  @MaxLength(50000)
  plotSummary: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(10000)
  targetCharsPerEpisode?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;
}
