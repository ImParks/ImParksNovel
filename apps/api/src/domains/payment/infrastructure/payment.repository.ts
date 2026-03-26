import { Injectable } from '@nestjs/common';
import {
  CoinTransactionType,
  MembershipStatus,
  MembershipTier,
  Prisma,
  PurchaseType,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

export interface PaginationArgs {
  first?: number;
  after?: string;
}

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf8');
}

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // CoinWallet
  // ──────────────────────────────────────────────

  async findWalletByUserId(userId: string) {
    return this.prisma.coinWallet.findUnique({ where: { userId } });
  }

  async createWallet(userId: string) {
    return this.prisma.coinWallet.create({
      data: {
        userId,
        balance: 0,
        totalCharged: 0,
        totalUsed: 0,
        totalRefunded: 0,
        version: 1,
      },
    });
  }

  async updateBalance(
    walletId: string,
    version: number,
    balanceChange: number,
    totalChargedChange: number,
    totalUsedChange: number,
  ) {
    return this.prisma.coinWallet.update({
      where: { id: walletId, version },
      data: {
        balance: { increment: balanceChange },
        totalCharged: { increment: totalChargedChange },
        totalUsed: { increment: totalUsedChange },
        version: { increment: 1 },
      },
    });
  }

  // ──────────────────────────────────────────────
  // CoinTransaction
  // ──────────────────────────────────────────────

  async createTransaction(data: {
    walletId: string;
    userId: string;
    type: CoinTransactionType;
    amount: number;
    balanceAfter: number;
    paymentId?: string;
    purchaseId?: string;
    supportId?: string;
    membershipId?: string;
    description?: string;
  }) {
    return this.prisma.coinTransaction.create({ data });
  }

  /**
   * Find transactions for a user, optionally filtered by type.
   * Returns array sorted by createdAt DESC (newest first).
   * Supports cursor pagination via after parameter.
   */
  async findTransactionsByUserId(
    userId: string,
    type?: CoinTransactionType,
    limit?: number,
    after?: string,
  ) {
    const take = limit ?? 20;
    const cursor = after ? decodeCursor(after) : undefined;

    const where: Prisma.CoinTransactionWhereInput = {
      userId,
      ...(type && { type }),
    };

    return this.prisma.coinTransaction.findMany({
      where,
      take: take + 1, // fetch one extra to determine hasNextPage
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // EpisodePurchase
  // ──────────────────────────────────────────────

  async createPurchase(data: {
    userId: string;
    episodeId: string;
    novelId: string;
    purchaseType: PurchaseType;
    coinsSpent: number;
    expiresAt?: Date;
    upgradedFrom?: string;
  }) {
    return this.prisma.episodePurchase.create({ data });
  }

  async findPurchase(userId: string, episodeId: string, purchaseType?: PurchaseType) {
    const where: Prisma.EpisodePurchaseWhereInput = {
      userId,
      episodeId,
    };

    if (purchaseType) {
      where.purchaseType = purchaseType;
    }

    const purchase = await this.prisma.episodePurchase.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 유효한 구매만 반환 (소유 또는 대여 미만료)
    if (!purchase) return null;

    // OWNERSHIP: 영구 소유
    if (purchase.purchaseType === PurchaseType.OWNERSHIP) {
      return purchase;
    }

    // RENTAL: expiresAt이 미만료
    if (purchase.expiresAt && purchase.expiresAt > new Date()) {
      return purchase;
    }

    return null;
  }

  /**
   * Find purchases by userId.
   * Returns array sorted by createdAt DESC (newest first).
   * Supports cursor pagination via after parameter.
   */
  async findPurchasesByUserId(
    userId: string,
    limit?: number,
    after?: string,
  ) {
    const take = limit ?? 20;
    const cursor = after ? decodeCursor(after) : undefined;

    const where: Prisma.EpisodePurchaseWhereInput = { userId };

    return this.prisma.episodePurchase.findMany({
      where,
      take: take + 1, // fetch one extra to determine hasNextPage
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
    });
  }

  async hasAnyPurchaseForNovel(novelId: string): Promise<boolean> {
    const count = await this.prisma.episodePurchase.count({
      where: { novelId },
    });
    return count > 0;
  }

  // ──────────────────────────────────────────────
  // Membership
  // ──────────────────────────────────────────────

  async findActiveMembership(userId: string) {
    return this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      orderBy: { expiresAt: 'desc' },
    });
  }

  async createMembership(data: {
    userId: string;
    tier: MembershipTier;
    status?: MembershipStatus;
    startedAt: Date;
    expiresAt: Date;
    autoRenew?: boolean;
    nextPaymentAt?: Date;
  }) {
    return this.prisma.membership.create({ data });
  }

  /**
   * Update membership by userId. Finds active membership first, then updates by id.
   */
  async updateMembership(
    userId: string,
    data: Prisma.MembershipUpdateInput,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!membership) {
      throw new Error(`Membership not found for userId: ${userId}`);
    }
    return this.prisma.membership.update({
      where: { id: membership.id },
      data,
    });
  }

  // ──────────────────────────────────────────────
  // Payment
  // ──────────────────────────────────────────────

  /**
   * Create a payment record.
   * Status defaults to PENDING.
   * Method defaults to CARD.
   */
  async createPayment(data: {
    orderId: string;
    userId: string;
    amount: number;
    method?: PaymentMethod;
  }) {
    return this.prisma.payment.create({
      data: {
        pgOrderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        method: data.method ?? PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        productType: 'COIN',
      },
    });
  }

  async findPaymentByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { pgOrderId: orderId },
    });
  }

  async updatePayment(
    id: string,
    data: Prisma.PaymentUncheckedUpdateInput,
  ) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  // ──────────────────────────────────────────────
  // Settlement (정산)
  // ──────────────────────────────────────────────

  /**
   * Find settlements by authorId, optionally filtered by period.
   * Returns array sorted by periodStart DESC (newest first).
   */
  async findSettlements(
    authorId: string,
    year?: number,
    month?: number,
  ) {
    const where: Prisma.SettlementWhereInput = { authorId };

    // Period filtering: where periodStart >= year-month-01 and periodEnd <= year-month-lastday
    if (year && month) {
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

      where.periodStart = { gte: periodStart };
      where.periodEnd = { lte: periodEnd };
    }

    return this.prisma.settlement.findMany({
      where,
      orderBy: { periodStart: 'desc' },
    });
  }

  /**
   * Calculate withdrawal available amount.
   * Sum of netAmount where status=COMPLETED and paidAt=null.
   */
  async getAvailableWithdrawalAmount(authorId: string): Promise<number> {
    const result = await this.prisma.settlement.aggregate({
      where: {
        authorId,
        status: 'COMPLETED',
        paidAt: null,
      },
      _sum: {
        netAmount: true,
      },
    });

    return result._sum.netAmount ?? 0;
  }

  /**
   * Get author dashboard statistics.
   * Aggregates data from Novel, EpisodePurchase, Support, and Settlement models.
   */
  async getAuthorDashboardStats(authorId: string): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    totalViews: number;
    monthlyViews: number;
    totalSupportAmount: number;
    subscriberCount: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total revenue from completed settlements
    const totalSettlement = await this.prisma.settlement.aggregate({
      where: {
        authorId,
        status: 'COMPLETED',
      },
      _sum: {
        netAmount: true,
      },
    });

    // Monthly revenue from settlements in current month
    const monthlySettlement = await this.prisma.settlement.aggregate({
      where: {
        authorId,
        status: 'COMPLETED',
        periodStart: { gte: monthStart },
        periodEnd: { lte: monthEnd },
      },
      _sum: {
        netAmount: true,
      },
    });

    // Total views from all novels by author
    const novelStats = await this.prisma.novel.aggregate({
      where: { authorId },
      _sum: {
        totalViews: true,
      },
    });

    // Monthly views from current period
    const episodes = await this.prisma.episode.findMany({
      where: {
        authorId,
        publishedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        viewCount: true,
      },
    });
    const monthlyViews = episodes.reduce((sum, ep) => sum + ep.viewCount, 0);

    // Total support amount
    const supportStats = await this.prisma.support.aggregate({
      where: { authorId },
      _sum: {
        coinsAmount: true,
      },
    });

    // Subscriber count (unique supporters)
    const supporterCount = await this.prisma.support.findMany({
      where: { authorId },
      distinct: ['supporterId'],
    });

    return {
      totalRevenue: totalSettlement._sum.netAmount ?? 0,
      monthlyRevenue: monthlySettlement._sum.netAmount ?? 0,
      totalViews: novelStats._sum.totalViews ?? 0,
      monthlyViews,
      totalSupportAmount: supportStats._sum.coinsAmount ?? 0,
      subscriberCount: supporterCount.length,
    };
  }

  /**
   * Get novel statistics by author.
   * Returns array of novels with aggregated stats.
   */
  async getNovelStats(
    authorId: string,
  ): Promise<
    Array<{
      novelId: string;
      title: string;
      totalViews: number;
      totalLikes: number;
      totalBookmarks: number;
      totalEpisodes: number;
      totalRevenue: number;
    }>
  > {
    const novels = await this.prisma.novel.findMany({
      where: { authorId },
      select: {
        id: true,
        title: true,
        totalViews: true,
        totalLikes: true,
        totalBookmarks: true,
        totalEpisodes: true,
      },
    });

    // Aggregate revenue from episode purchases per novel
    const revenues = await this.prisma.episodePurchase.groupBy({
      by: ['novelId'],
      where: {
        novelId: { in: novels.map((n) => n.id) },
      },
      _sum: {
        coinsSpent: true,
      },
    });

    const revenueMap = new Map(revenues.map((r) => [r.novelId, r._sum.coinsSpent ?? 0]));

    return novels.map((novel) => ({
      novelId: novel.id,
      title: novel.title,
      totalViews: novel.totalViews,
      totalLikes: novel.totalLikes,
      totalBookmarks: novel.totalBookmarks,
      totalEpisodes: novel.totalEpisodes,
      totalRevenue: revenueMap.get(novel.id) ?? 0,
    }));
  }
}
