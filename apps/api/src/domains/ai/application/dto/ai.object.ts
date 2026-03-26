import { Field, Int, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AIFeatureType, AITokenTransactionType } from '@prisma/client';
import { PageInfo } from '../../../novel/application/dto/novel.object';

// ──────────────────────────────────────────────
// Enum registration
// ──────────────────────────────────────────────

registerEnumType(AIFeatureType, { name: 'AIFeatureType' });
registerEnumType(AITokenTransactionType, { name: 'AITokenTransactionType' });

// ──────────────────────────────────────────────
// AI Token Balance
// ──────────────────────────────────────────────

@ObjectType()
export class AITokenBalanceObject {
  @Field(() => Int)
  balance: number;

  @Field(() => Int)
  totalCharged: number;

  @Field(() => Int)
  totalUsed: number;
}

// ──────────────────────────────────────────────
// AI Token Transaction
// ──────────────────────────────────────────────

@ObjectType()
export class AITokenTransactionObject {
  @Field(() => ID)
  id: string;

  @Field(() => AITokenTransactionType)
  type: AITokenTransactionType;

  @Field(() => Int)
  amount: number;

  @Field(() => Int)
  balanceAfter: number;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AITokenTransactionEdge {
  @Field(() => AITokenTransactionObject)
  node: AITokenTransactionObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class AITokenTransactionConnection {
  @Field(() => [AITokenTransactionEdge])
  edges: AITokenTransactionEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ──────────────────────────────────────────────
// Novel Setting (AI 설정 노트)
// ──────────────────────────────────────────────

@ObjectType()
export class SettingNoteObject {
  @Field(() => ID)
  id: string;

  @Field()
  novelId: string;

  @Field()
  category: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field()
  isAIGenerated: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class SettingNoteEdge {
  @Field(() => SettingNoteObject)
  node: SettingNoteObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class SettingNoteConnection {
  @Field(() => [SettingNoteEdge])
  edges: SettingNoteEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
