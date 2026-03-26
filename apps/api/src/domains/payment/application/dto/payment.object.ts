import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  CoinTransactionType,
  MembershipStatus,
  MembershipTier,
  PaymentMethod,
  PaymentStatus,
  PurchaseType,
  SettlementStatus,
} from '@prisma/client';
import { PageInfo } from '../../../novel/application/dto/novel.object';

// ──────────────────────────────────────────────
// Enum registration
// ──────────────────────────────────────────────

registerEnumType(PurchaseType, { name: 'PurchaseType' });
registerEnumType(MembershipTier, { name: 'MembershipTier' });
registerEnumType(MembershipStatus, { name: 'MembershipStatus' });
registerEnumType(SettlementStatus, { name: 'SettlementStatus' });
registerEnumType(CoinTransactionType, { name: 'CoinTransactionType' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

// ──────────────────────────────────────────────
// Coin Balance
// ──────────────────────────────────────────────

@ObjectType()
export class CoinBalanceObject {
  @Field(() => Int)
  balance: number;

  @Field(() => Int)
  totalCharged: number;

  @Field(() => Int)
  totalUsed: number;
}

// ──────────────────────────────────────────────
// Coin Transaction
// ──────────────────────────────────────────────

@ObjectType()
export class CoinTransactionObject {
  @Field(() => ID)
  id: string;

  @Field(() => CoinTransactionType)
  type: CoinTransactionType;

  @Field(() => Int)
  amount: number;

  @Field(() => Int)
  balanceAfter: number;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class CoinTransactionEdge {
  @Field(() => CoinTransactionObject)
  node: CoinTransactionObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class CoinTransactionConnection {
  @Field(() => [CoinTransactionEdge])
  edges: CoinTransactionEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ──────────────────────────────────────────────
// Episode Ownership
// ──────────────────────────────────────────────

@ObjectType()
export class EpisodeOwnershipObject {
  @Field(() => ID)
  id: string;

  @Field()
  episodeId: string;

  @Field(() => PurchaseType)
  purchaseType: PurchaseType;

  @Field(() => Int)
  coinsSpent: number;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date | null;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class EpisodeOwnershipEdge {
  @Field(() => EpisodeOwnershipObject)
  node: EpisodeOwnershipObject;

  @Field()
  cursor: string;
}

@ObjectType()
export class EpisodeOwnershipConnection {
  @Field(() => [EpisodeOwnershipEdge])
  edges: EpisodeOwnershipEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// ──────────────────────────────────────────────
// Membership
// ──────────────────────────────────────────────

@ObjectType()
export class MembershipObject {
  @Field(() => ID)
  id: string;

  @Field(() => MembershipTier)
  tier: MembershipTier;

  @Field(() => MembershipStatus)
  status: MembershipStatus;

  @Field()
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;

  @Field()
  autoRenew: boolean;

  @Field()
  createdAt: Date;
}

// ──────────────────────────────────────────────
// Payment Preparation
// ──────────────────────────────────────────────

@ObjectType()
export class PaymentPrepareObject {
  @Field()
  orderId: string;

  @Field(() => Int)
  amount: number;

  @Field()
  orderName: string;

  @Field()
  customerKey: string;
}

// ──────────────────────────────────────────────
// Settlement
// ──────────────────────────────────────────────

@ObjectType()
export class SettlementObject {
  @Field(() => ID)
  id: string;

  @Field()
  periodStart: Date;

  @Field()
  periodEnd: Date;

  @Field(() => Int)
  episodeSalesAmount: number;

  @Field(() => Int)
  supportAmount: number;

  @Field(() => Int)
  platformFee: number;

  @Field(() => Int)
  aiFee: number;

  @Field(() => Int)
  netAmount: number;

  @Field(() => SettlementStatus)
  status: SettlementStatus;

  @Field()
  createdAt: Date;
}

// ──────────────────────────────────────────────
// Author Dashboard
// ──────────────────────────────────────────────

@ObjectType()
export class NovelStatsObject {
  @Field(() => ID)
  novelId: string;

  @Field()
  title: string;

  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalBookmarks: number;

  @Field(() => Int)
  totalEpisodes: number;

  @Field(() => Int)
  totalRevenue: number;
}

@ObjectType()
export class AuthorDashboardObject {
  @Field(() => Int)
  totalRevenue: number;

  @Field(() => Int)
  monthlyRevenue: number;

  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  monthlyViews: number;

  @Field(() => Int)
  totalSupportAmount: number;

  @Field(() => Int)
  subscriberCount: number;

  @Field(() => [NovelStatsObject])
  novels: NovelStatsObject[];
}
