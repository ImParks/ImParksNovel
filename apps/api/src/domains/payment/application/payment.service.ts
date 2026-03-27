import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoinTransactionType, PurchaseType, MembershipTier, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { TossPaymentsAdapter } from '../infrastructure/toss-payments.adapter';
import { PaginationParams } from '../../../common/types/pagination';
import { CursorHelper } from '../../../common/utils/cursor.helper';

import {
  CoinBalanceObject,
  CoinTransactionConnection,
  EpisodeOwnershipObject,
  EpisodeOwnershipConnection,
  MembershipObject,
  PaymentConfigObject,
  PaymentPrepareObject,
  SettlementObject,
  AuthorDashboardObject,
  NovelStatsObject,
} from './dto/payment.object';
import { ConfirmChargeInput, ConfirmSubscriptionInput, SponsorInput } from './dto/payment.input';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const COIN_PACKAGES = [
  { id: 'coin_1000', amount: 1000, coins: 10, bonusCoins: 0, name: '10 코인' },
  { id: 'coin_5000', amount: 5000, coins: 55, bonusCoins: 5, name: '55 코인' },
  { id: 'coin_10000', amount: 10000, coins: 120, bonusCoins: 20, name: '120 코인' },
  { id: 'coin_50000', amount: 50000, coins: 650, bonusCoins: 50, name: '650 코인' },
];

const MEMBERSHIP_PRICES = {
  [MembershipTier.BASIC]: 4900,
  [MembershipTier.PREMIUM]: 9900,
  [MembershipTier.VIP]: 19900,
};

const MEMBERSHIP_BONUS_COINS = {
  [MembershipTier.BASIC]: 30,
  [MembershipTier.PREMIUM]: 100,
  [MembershipTier.VIP]: 250,
};

const RENTAL_PRICE_RATIOS = {
  RENTAL_3D: 0.3,
  RENTAL_7D: 0.4,
  RENTAL_14D: 0.5,
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRepository: PaymentRepository,
    private readonly tossPayments: TossPaymentsAdapter,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────
  // Payment Config (public)
  // ──────────────────────────────────────────────

  getPaymentConfig(): PaymentConfigObject {
    return {
      clientKey: this.config.getOrThrow<string>('TOSS_CLIENT_KEY'),
    };
  }

  // ──────────────────────────────────────────────
  // Coin: Queries
  // ──────────────────────────────────────────────

  async getCoinBalance(userId: string): Promise<CoinBalanceObject> {
    const wallet = await this.paymentRepository.findWalletByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('코인 지갑을 찾을 수 없습니다.');
    }

    return {
      balance: wallet.balance,
      totalCharged: wallet.totalCharged,
      totalUsed: wallet.totalUsed,
    };
  }

  async getCoinTransactions(
    userId: string,
    type?: CoinTransactionType,
    pagination?: PaginationParams,
  ): Promise<CoinTransactionConnection> {
    const first = pagination?.first ?? 10;
    const after = pagination?.after;

    const transactions = await this.paymentRepository.findTransactionsByUserId(
      userId,
      type,
      first + 1, // fetch one extra to determine hasNextPage
      after,
    );

    const hasNextPage = transactions.length > first;
    const edges = transactions
      .slice(0, first)
      .map((tx) => ({
        node: {
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          balanceAfter: tx.balanceAfter,
          description: tx.description,
          createdAt: tx.createdAt,
        },
        cursor: CursorHelper.encode(tx.id),
      }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
      },
      totalCount: edges.length,
    };
  }

  // ──────────────────────────────────────────────
  // Coin: Charge Flow
  // ──────────────────────────────────────────────

  async prepareCoinCharge(userId: string, packageId: string): Promise<PaymentPrepareObject> {
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw new BadRequestException('유효하지 않은 코인 패키지입니다.');
    }

    const orderId = `coin_${userId}_${Date.now()}`;
    const orderName = pkg.name;
    const customerKey = userId;

    // Payment 레코드 생성 (Infrastructure 레이어에서 처리)
    await this.paymentRepository.createPayment({
      orderId,
      userId,
      amount: pkg.amount,
      method: 'CARD', // 기본값, Toss에서 선택 가능
    });

    return {
      orderId,
      amount: pkg.amount,
      orderName,
      customerKey,
    };
  }

  async confirmCoinCharge(
    userId: string,
    input: ConfirmChargeInput,
  ): Promise<CoinBalanceObject> {
    // 1. Payment 레코드 확인
    const payment = await this.paymentRepository.findPaymentByOrderId(input.orderId);
    if (!payment) {
      throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    }

    if (payment.userId !== userId) {
      throw new BadRequestException('결제 소유자 불일치');
    }

    // 2. 멱등성 검증: 이미 완료된 결제면 에러
    if (payment.status === 'COMPLETED') {
      throw new BadRequestException('이미 완료된 결제입니다.');
    }

    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      throw new BadRequestException('취소되었거나 실패한 결제입니다.');
    }

    // 3. Toss 결제 확인
    try {
      const tossResponse = await this.tossPayments.confirmPayment(
        input.paymentKey,
        input.orderId,
        input.amount,
      );

      // Toss 응답 검증 (상태 확인)
      if (tossResponse.status !== 'COMPLETED') {
        throw new BadRequestException(`결제 상태가 유효하지 않습니다: ${tossResponse.status}`);
      }
    } catch (error) {
      // 결제 실패 기록
      await this.paymentRepository.updatePayment(payment.id, { status: 'FAILED' });
      throw error;
    }

    // 4. 트랜잭션: 지갑 업데이트 + 거래 기록
    const wallet = await this.prisma.$transaction(async (tx) => {
      // 지갑 조회 또는 생성 (낙관적 잠금)
      let walletRecord = await tx.coinWallet.findUnique({ where: { userId } });
      if (!walletRecord) {
        walletRecord = await tx.coinWallet.create({
          data: { userId, balance: 0, totalCharged: 0, totalUsed: 0 },
        });
      }

      // 코인 패키지 정보 조회
      const pkg = COIN_PACKAGES.find((p) => p.amount === payment.amount);
      if (!pkg) {
        throw new InternalServerErrorException('코인 패키지 정보를 찾을 수 없습니다.');
      }

      const totalCoins = pkg.coins + pkg.bonusCoins;

      // 지갑 업데이트 (낙관적 잠금)
      const updated = await tx.coinWallet.update({
        where: { userId },
        data: {
          balance: { increment: totalCoins },
          totalCharged: { increment: totalCoins },
        },
      });

      // 거래 기록
      await tx.coinTransaction.create({
        data: {
          walletId: updated.id,
          userId,
          type: CoinTransactionType.CHARGE,
          amount: totalCoins,
          balanceAfter: updated.balance,
          description: `${pkg.coins} + ${pkg.bonusCoins} 보너스 코인 충전`,
        },
      });

      // Payment 상태 업데이트
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      return updated;
    });

    return {
      balance: wallet.balance,
      totalCharged: wallet.totalCharged,
      totalUsed: wallet.totalUsed,
    };
  }

  // ──────────────────────────────────────────────
  // Purchase: Queries
  // ──────────────────────────────────────────────

  async getEpisodeOwnership(
    userId: string,
    episodeId: string,
  ): Promise<EpisodeOwnershipObject | null> {
    const purchase = await this.paymentRepository.findPurchase(userId, episodeId);
    if (!purchase) return null;

    return {
      id: purchase.id,
      episodeId: purchase.episodeId,
      purchaseType: purchase.purchaseType,
      coinsSpent: purchase.coinsSpent,
      expiresAt: purchase.expiresAt,
      createdAt: purchase.createdAt,
    };
  }

  async getPurchaseHistory(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<EpisodeOwnershipConnection> {
    const first = pagination?.first ?? 10;
    const after = pagination?.after;

    const purchases = await this.paymentRepository.findPurchasesByUserId(
      userId,
      first + 1,
      after,
    );

    const hasNextPage = purchases.length > first;
    const edges = purchases
      .slice(0, first)
      .map((purchase) => ({
        node: {
          id: purchase.id,
          episodeId: purchase.episodeId,
          purchaseType: purchase.purchaseType,
          coinsSpent: purchase.coinsSpent,
          expiresAt: purchase.expiresAt,
          createdAt: purchase.createdAt,
        },
        cursor: CursorHelper.encode(purchase.id),
      }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
      },
      totalCount: edges.length,
    };
  }

  async hasEpisodeAccess(userId: string, episodeId: string): Promise<boolean> {
    // 1. Episode 조회: 무료 회차인지 확인
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { isFree: true },
    });

    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }

    if (episode.isFree) {
      return true;
    }

    // 2. 구매 기록 확인
    const purchase = await this.paymentRepository.findPurchase(userId, episodeId);
    if (!purchase) {
      return false;
    }

    // 3. 대여 기한 만료 확인
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  async hasNovelPurchases(novelId: string): Promise<boolean> {
    return this.paymentRepository.hasAnyPurchaseForNovel(novelId);
  }

  // ──────────────────────────────────────────────
  // Purchase: Buy Episode
  // ──────────────────────────────────────────────

  async purchaseEpisode(userId: string, episodeId: string): Promise<EpisodeOwnershipObject> {
    // 1. 중복 구매 확인
    const existing = await this.paymentRepository.findPurchase(userId, episodeId);
    if (existing) {
      throw new BadRequestException('이미 구매한 회차입니다.');
    }

    // 2. Episode 정보 조회 (가격 확인)
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { price: true, isFree: true, novelId: true },
    });

    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }

    if (episode.isFree) {
      throw new BadRequestException('무료 회차는 구매할 수 없습니다.');
    }

    const price = episode.price ?? 0;
    if (price <= 0) {
      throw new BadRequestException('구매 불가능한 회차입니다.');
    }

    // 3. 트랜잭션: 코인 차감 + 구매 기록
    const purchase = await this.prisma.$transaction(async (tx) => {
      // 지갑 조회 (낙관적 잠금)
      const wallet = await tx.coinWallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < price) {
        throw new BadRequestException('코인이 부족합니다.');
      }

      // 지갑 업데이트
      const updated = await tx.coinWallet.update({
        where: { userId },
        data: {
          balance: { decrement: price },
          totalUsed: { increment: price },
        },
      });

      // 구매 기록
      const newPurchase = await tx.episodePurchase.create({
        data: {
          userId,
          episodeId,
          novelId: episode.novelId,
          purchaseType: PurchaseType.OWNERSHIP,
          coinsSpent: price,
        },
      });

      // 거래 기록
      await tx.coinTransaction.create({
        data: {
          walletId: updated.id,
          userId,
          type: CoinTransactionType.PURCHASE,
          amount: -price,
          balanceAfter: updated.balance,
          description: `회차 구매 (Episode: ${episodeId})`,
        },
      });

      return newPurchase;
    });

    return {
      id: purchase.id,
      episodeId: purchase.episodeId,
      purchaseType: purchase.purchaseType,
      coinsSpent: purchase.coinsSpent,
      expiresAt: purchase.expiresAt,
      createdAt: purchase.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // Purchase: Rent Episode
  // ──────────────────────────────────────────────

  async rentEpisode(
    userId: string,
    episodeId: string,
    days: 3 | 7 | 14,
  ): Promise<EpisodeOwnershipObject> {
    // 1. 중복 대여 확인
    const existing = await this.paymentRepository.findPurchase(userId, episodeId);
    if (existing) {
      throw new BadRequestException('이미 구매하거나 대여한 회차입니다.');
    }

    // 2. Episode 정보 조회
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { price: true, isFree: true, novelId: true },
    });

    if (!episode) {
      throw new NotFoundException('회차를 찾을 수 없습니다.');
    }

    if (episode.isFree) {
      throw new BadRequestException('무료 회차는 대여할 수 없습니다.');
    }

    const ownershipPrice = episode.price ?? 0;
    if (ownershipPrice <= 0) {
      throw new BadRequestException('대여 불가능한 회차입니다.');
    }

    // 3. 대여 가격 계산
    const ratioKey = `RENTAL_${days}D` as keyof typeof RENTAL_PRICE_RATIOS;
    const ratio = RENTAL_PRICE_RATIOS[ratioKey];
    const rentalPrice = Math.ceil(ownershipPrice * ratio);

    // 4. 트랜잭션: 코인 차감 + 대여 기록
    const purchaseType =
      days === 3
        ? PurchaseType.RENTAL_3D
        : days === 7
          ? PurchaseType.RENTAL_7D
          : PurchaseType.RENTAL_14D;

    const purchase = await this.prisma.$transaction(async (tx) => {
      // 지갑 조회 (낙관적 잠금)
      const wallet = await tx.coinWallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < rentalPrice) {
        throw new BadRequestException('코인이 부족합니다.');
      }

      // 지갑 업데이트
      const updated = await tx.coinWallet.update({
        where: { userId },
        data: {
          balance: { decrement: rentalPrice },
          totalUsed: { increment: rentalPrice },
        },
      });

      // 대여 기록
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const newPurchase = await tx.episodePurchase.create({
        data: {
          userId,
          episodeId,
          novelId: episode.novelId,
          purchaseType,
          coinsSpent: rentalPrice,
          expiresAt,
        },
      });

      // 거래 기록
      await tx.coinTransaction.create({
        data: {
          walletId: updated.id,
          userId,
          type: CoinTransactionType.PURCHASE,
          amount: -rentalPrice,
          balanceAfter: updated.balance,
          description: `회차 대여 ${days}일 (Episode: ${episodeId})`,
        },
      });

      return newPurchase;
    });

    return {
      id: purchase.id,
      episodeId: purchase.episodeId,
      purchaseType: purchase.purchaseType,
      coinsSpent: purchase.coinsSpent,
      expiresAt: purchase.expiresAt,
      createdAt: purchase.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // Membership: Queries
  // ──────────────────────────────────────────────

  async getMyMembership(userId: string): Promise<MembershipObject | null> {
    const membership = await this.paymentRepository.findActiveMembership(userId);
    if (!membership) return null;

    return {
      id: membership.id,
      tier: membership.tier,
      status: membership.status,
      startedAt: membership.startedAt,
      expiresAt: membership.expiresAt,
      autoRenew: membership.autoRenew,
      createdAt: membership.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // Membership: Subscribe Flow
  // ──────────────────────────────────────────────

  async prepareMembershipSubscription(
    userId: string,
    tier: MembershipTier,
  ): Promise<PaymentPrepareObject> {
    const amount = MEMBERSHIP_PRICES[tier];
    if (!amount) {
      throw new BadRequestException('유효하지 않은 멤버십 등급입니다.');
    }

    const orderId = `membership_${userId}_${tier}_${Date.now()}`;
    const tierLabel = tier === MembershipTier.BASIC ? 'Basic' :
                      tier === MembershipTier.PREMIUM ? 'Premium' : 'VIP';
    const orderName = `${tierLabel} 멤버십`;
    const customerKey = userId;

    // Payment 레코드 생성
    await this.paymentRepository.createPayment({
      orderId,
      userId,
      amount,
      method: 'CARD',
    });

    return {
      orderId,
      amount,
      orderName,
      customerKey,
    };
  }

  async confirmMembershipSubscription(
    userId: string,
    input: ConfirmSubscriptionInput,
  ): Promise<MembershipObject> {
    // 1. Payment 레코드 확인
    const payment = await this.paymentRepository.findPaymentByOrderId(input.orderId);
    if (!payment) {
      throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    }

    if (payment.userId !== userId) {
      throw new BadRequestException('결제 소유자 불일치');
    }

    if (payment.status === 'COMPLETED') {
      throw new BadRequestException('이미 완료된 결제입니다.');
    }

    // 2. Toss 결제 확인
    try {
      const tossResponse = await this.tossPayments.confirmPayment(
        input.paymentKey,
        input.orderId,
        input.amount,
      );

      // Toss 응답 검증 (상태 확인)
      if (tossResponse.status !== 'COMPLETED') {
        throw new BadRequestException(`멤버십 결제 상태가 유효하지 않습니다: ${tossResponse.status}`);
      }
    } catch (error) {
      // 결제 실패 기록
      await this.paymentRepository.updatePayment(payment.id, { status: 'FAILED' });
      throw error;
    }

    // 3. orderId에서 tier 추출
    const tierMatch = input.orderId.match(/(BASIC|PREMIUM|VIP)/i);
    const tier = tierMatch
      ? (tierMatch[1].toUpperCase() as MembershipTier)
      : MembershipTier.BASIC;

    // 4. 트랜잭션: 멤버십 생성 + 보너스 코인 지급
    const membership = await this.prisma.$transaction(async (tx) => {
      // 기존 멤버십 조회
      const existingMembership = await tx.membership.findFirst({
        where: { userId, status: MembershipStatus.ACTIVE },
      });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      let newMembership;
      if (existingMembership && existingMembership.status === MembershipStatus.ACTIVE) {
        // 기존 멤버십이 있으면 업그레이드
        newMembership = await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            tier,
            status: MembershipStatus.ACTIVE,
            startedAt: now,
            expiresAt,
            autoRenew: true,
          },
        });
      } else {
        // 새 멤버십 생성
        newMembership = await tx.membership.create({
          data: {
            userId,
            tier,
            status: MembershipStatus.ACTIVE,
            startedAt: now,
            expiresAt,
            autoRenew: true,
          },
        });
      }

      // 보너스 코인 지급
      const bonusCoins = MEMBERSHIP_BONUS_COINS[tier];
      let wallet = await tx.coinWallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.coinWallet.create({
          data: { userId, balance: 0, totalCharged: 0, totalUsed: 0 },
        });
      }

      const updated = await tx.coinWallet.update({
        where: { userId },
        data: {
          balance: { increment: bonusCoins },
          totalCharged: { increment: bonusCoins },
        },
      });

      // 거래 기록
      await tx.coinTransaction.create({
        data: {
          walletId: updated.id,
          userId,
          type: CoinTransactionType.MEMBERSHIP,
          amount: bonusCoins,
          balanceAfter: updated.balance,
          description: `${tier} 멤버십 보너스 코인`,
        },
      });

      // Payment 상태 업데이트
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      return newMembership;
    });

    return {
      id: membership.id,
      tier: membership.tier,
      status: membership.status,
      startedAt: membership.startedAt,
      expiresAt: membership.expiresAt,
      autoRenew: membership.autoRenew,
      createdAt: membership.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // Membership: Cancel
  // ──────────────────────────────────────────────

  async cancelMembership(userId: string): Promise<MembershipObject> {
    const membership = await this.paymentRepository.findActiveMembership(userId);
    if (!membership) {
      throw new NotFoundException('활성 멤버십이 없습니다.');
    }

    const updated = await this.paymentRepository.updateMembership(userId, {
      status: MembershipStatus.CANCELLED,
      autoRenew: false,
    });

    return {
      id: updated.id,
      tier: updated.tier,
      status: updated.status,
      startedAt: updated.startedAt,
      expiresAt: updated.expiresAt,
      autoRenew: updated.autoRenew,
      createdAt: updated.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // Sponsorship (Support)
  // ──────────────────────────────────────────────

  async sendSupport(userId: string, input: SponsorInput): Promise<CoinBalanceObject> {
    // 1. 작가 확인
    const author = await this.prisma.user.findUnique({
      where: { id: input.authorId },
      select: { id: true },
    });

    if (!author) {
      throw new NotFoundException('작가를 찾을 수 없습니다.');
    }

    // 2. 트랜잭션: 코인 차감 + 후원 기록
    const wallet = await this.prisma.$transaction(async (tx) => {
      // 지갑 조회 (낙관적 잠금)
      const userWallet = await tx.coinWallet.findUnique({ where: { userId } });
      if (!userWallet || userWallet.balance < input.coinAmount) {
        throw new BadRequestException('코인이 부족합니다.');
      }

      // 후원자 지갑 업데이트
      const updated = await tx.coinWallet.update({
        where: { userId },
        data: {
          balance: { decrement: input.coinAmount },
          totalUsed: { increment: input.coinAmount },
        },
      });

      // 작가 지갑 업데이트
      let authorWallet = await tx.coinWallet.findUnique({ where: { userId: input.authorId } });
      if (!authorWallet) {
        authorWallet = await tx.coinWallet.create({
          data: { userId: input.authorId, balance: 0, totalCharged: 0, totalUsed: 0 },
        });
      }

      const authorUpdated = await tx.coinWallet.update({
        where: { userId: input.authorId },
        data: {
          balance: { increment: input.coinAmount },
        },
      });

      // 후원 기록
      await tx.support.create({
        data: {
          supporterId: userId,
          authorId: input.authorId,
          coinsAmount: input.coinAmount,
          message: input.message,
          isAnonymous: input.isAnonymous ?? false,
        },
      });

      // 거래 기록 (지원자)
      await tx.coinTransaction.create({
        data: {
          walletId: updated.id,
          userId,
          type: CoinTransactionType.SUPPORT_SENT,
          amount: -input.coinAmount,
          balanceAfter: updated.balance,
          description: `작가 후원: ${input.isAnonymous ? '익명' : 'userId'}`,
        },
      });

      // 거래 기록 (작가)
      await tx.coinTransaction.create({
        data: {
          walletId: authorUpdated.id,
          userId: input.authorId,
          type: CoinTransactionType.SUPPORT_RECEIVED,
          amount: input.coinAmount,
          balanceAfter: authorUpdated.balance,
          description: `후원 받음: ${input.isAnonymous ? '익명 후원자' : userId}`,
        },
      });

      return updated;
    });

    return {
      balance: wallet.balance,
      totalCharged: wallet.totalCharged,
      totalUsed: wallet.totalUsed,
    };
  }

  // ──────────────────────────────────────────────
  // Settlement (정산)
  // ──────────────────────────────────────────────

  async getSettlements(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<SettlementObject[]> {
    // 작가 권한 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('작가만 정산 내역을 조회할 수 있습니다.');
    }

    const settlements = await this.paymentRepository.findSettlements(userId, year, month);

    return settlements.map((s) => ({
      id: s.id,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      episodeSalesAmount: s.episodeSalesAmount,
      supportAmount: s.supportAmount,
      platformFee: s.platformFee,
      aiFee: s.aiFee,
      netAmount: s.netAmount,
      status: s.status,
      createdAt: s.createdAt,
    }));
  }

  async getAvailableWithdrawalAmount(userId: string): Promise<number> {
    // 작가 권한 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('작가만 출금 가능 금액을 조회할 수 있습니다.');
    }

    return this.paymentRepository.getAvailableWithdrawalAmount(userId);
  }

  // ──────────────────────────────────────────────
  // Author Dashboard
  // ──────────────────────────────────────────────

  async getAuthorDashboard(userId: string): Promise<AuthorDashboardObject> {
    // 작가 권한 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('작가만 대시보드를 조회할 수 있습니다.');
    }

    const stats = await this.paymentRepository.getAuthorDashboardStats(userId);
    const novels = await this.paymentRepository.getNovelStats(userId);

    const novelStatsObjects: NovelStatsObject[] = novels.map((n) => ({
      novelId: n.novelId,
      title: n.title,
      totalViews: n.totalViews,
      totalLikes: n.totalLikes,
      totalBookmarks: n.totalBookmarks,
      totalEpisodes: n.totalEpisodes,
      totalRevenue: n.totalRevenue,
    }));

    return {
      totalRevenue: stats.totalRevenue,
      monthlyRevenue: stats.monthlyRevenue,
      totalViews: stats.totalViews,
      monthlyViews: stats.monthlyViews,
      totalSupportAmount: stats.totalSupportAmount,
      subscriberCount: stats.subscriberCount,
      novels: novelStatsObjects,
    };
  }

  async getNovelStats(userId: string): Promise<NovelStatsObject[]> {
    // 작가 권한 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BadRequestException('작가만 소설 통계를 조회할 수 있습니다.');
    }

    const stats = await this.paymentRepository.getNovelStats(userId);

    return stats.map((s) => ({
      novelId: s.novelId,
      title: s.title,
      totalViews: s.totalViews,
      totalLikes: s.totalLikes,
      totalBookmarks: s.totalBookmarks,
      totalEpisodes: s.totalEpisodes,
      totalRevenue: s.totalRevenue,
    }));
  }
}
