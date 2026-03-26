import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CoinTransactionType, MembershipTier } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../../common/types/context';
import { PaymentService } from '../application/payment.service';
import { ConfirmChargeInput, ConfirmSubscriptionInput, SponsorInput } from '../application/dto/payment.input';
import {
  CoinBalanceObject,
  CoinTransactionConnection,
  EpisodeOwnershipObject,
  EpisodeOwnershipConnection,
  MembershipObject,
  PaymentPrepareObject,
  SettlementObject,
  AuthorDashboardObject,
  NovelStatsObject,
} from '../application/dto/payment.object';

@Resolver()
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  // ──────────────────────────────────────────────
  // Coin Queries
  // ──────────────────────────────────────────────

  @Query(() => CoinBalanceObject)
  @UseGuards(JwtAuthGuard)
  async coinBalance(@CurrentUser() user: JwtPayload): Promise<CoinBalanceObject> {
    return this.paymentService.getCoinBalance(user.userId);
  }

  @Query(() => CoinTransactionConnection)
  @UseGuards(JwtAuthGuard)
  async coinTransactions(
    @CurrentUser() user: JwtPayload,
    @Args('type', { type: () => CoinTransactionType, nullable: true }) type?: CoinTransactionType,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<CoinTransactionConnection> {
    return this.paymentService.getCoinTransactions(user.userId, type, { first, after });
  }

  // ──────────────────────────────────────────────
  // Coin Mutations
  // ──────────────────────────────────────────────

  @Mutation(() => PaymentPrepareObject)
  @UseGuards(JwtAuthGuard)
  async prepareCoinCharge(
    @CurrentUser() user: JwtPayload,
    @Args('packageId', { type: () => ID }) packageId: string,
  ): Promise<PaymentPrepareObject> {
    return this.paymentService.prepareCoinCharge(user.userId, packageId);
  }

  @Mutation(() => CoinBalanceObject)
  @UseGuards(JwtAuthGuard)
  async confirmCoinCharge(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: ConfirmChargeInput,
  ): Promise<CoinBalanceObject> {
    return this.paymentService.confirmCoinCharge(user.userId, input);
  }

  // ──────────────────────────────────────────────
  // Purchase Queries
  // ──────────────────────────────────────────────

  @Query(() => EpisodeOwnershipObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async episodeOwnership(
    @CurrentUser() user: JwtPayload,
    @Args('episodeId', { type: () => ID }) episodeId: string,
  ): Promise<EpisodeOwnershipObject | null> {
    return this.paymentService.getEpisodeOwnership(user.userId, episodeId);
  }

  @Query(() => EpisodeOwnershipConnection)
  @UseGuards(JwtAuthGuard)
  async purchaseHistory(
    @CurrentUser() user: JwtPayload,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<EpisodeOwnershipConnection> {
    return this.paymentService.getPurchaseHistory(user.userId, { first, after });
  }

  // ──────────────────────────────────────────────
  // Purchase Mutations
  // ──────────────────────────────────────────────

  @Mutation(() => EpisodeOwnershipObject)
  @UseGuards(JwtAuthGuard)
  async purchaseEpisode(
    @CurrentUser() user: JwtPayload,
    @Args('episodeId', { type: () => ID }) episodeId: string,
  ): Promise<EpisodeOwnershipObject> {
    return this.paymentService.purchaseEpisode(user.userId, episodeId);
  }

  @Mutation(() => EpisodeOwnershipObject)
  @UseGuards(JwtAuthGuard)
  async rentEpisode(
    @CurrentUser() user: JwtPayload,
    @Args('episodeId', { type: () => ID }) episodeId: string,
    @Args('days', { type: () => Int }) days: number,
  ): Promise<EpisodeOwnershipObject> {
    return this.paymentService.rentEpisode(user.userId, episodeId, days as 3 | 7 | 14);
  }

  // ──────────────────────────────────────────────
  // Membership Queries
  // ──────────────────────────────────────────────

  @Query(() => MembershipObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async myMembership(@CurrentUser() user: JwtPayload): Promise<MembershipObject | null> {
    return this.paymentService.getMyMembership(user.userId);
  }

  // ──────────────────────────────────────────────
  // Membership Mutations
  // ──────────────────────────────────────────────

  @Mutation(() => PaymentPrepareObject)
  @UseGuards(JwtAuthGuard)
  async prepareMembershipSubscription(
    @CurrentUser() user: JwtPayload,
    @Args('tier', { type: () => MembershipTier }) tier: MembershipTier,
  ): Promise<PaymentPrepareObject> {
    return this.paymentService.prepareMembershipSubscription(user.userId, tier);
  }

  @Mutation(() => MembershipObject)
  @UseGuards(JwtAuthGuard)
  async confirmMembershipSubscription(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: ConfirmSubscriptionInput,
  ): Promise<MembershipObject> {
    return this.paymentService.confirmMembershipSubscription(user.userId, input);
  }

  @Mutation(() => MembershipObject)
  @UseGuards(JwtAuthGuard)
  async cancelMembership(@CurrentUser() user: JwtPayload): Promise<MembershipObject> {
    return this.paymentService.cancelMembership(user.userId);
  }

  // ──────────────────────────────────────────────
  // Support Mutation
  // ──────────────────────────────────────────────

  @Mutation(() => CoinBalanceObject)
  @UseGuards(JwtAuthGuard)
  async sponsorAuthor(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: SponsorInput,
  ): Promise<CoinBalanceObject> {
    return this.paymentService.sendSupport(user.userId, input);
  }

  // ──────────────────────────────────────────────
  // Settlement Queries (Author Only)
  // ──────────────────────────────────────────────

  @Query(() => [SettlementObject])
  @UseGuards(JwtAuthGuard)
  async settlements(
    @CurrentUser() user: JwtPayload,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('month', { type: () => Int, nullable: true }) month?: number,
  ): Promise<SettlementObject[]> {
    return this.paymentService.getSettlements(user.userId, year, month);
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  async availableWithdrawalAmount(@CurrentUser() user: JwtPayload): Promise<number> {
    return this.paymentService.getAvailableWithdrawalAmount(user.userId);
  }

  // ──────────────────────────────────────────────
  // Author Dashboard Queries (Author Only)
  // ──────────────────────────────────────────────

  @Query(() => AuthorDashboardObject)
  @UseGuards(JwtAuthGuard)
  async authorDashboard(@CurrentUser() user: JwtPayload): Promise<AuthorDashboardObject> {
    return this.paymentService.getAuthorDashboard(user.userId);
  }

  @Query(() => [NovelStatsObject])
  @UseGuards(JwtAuthGuard)
  async novelStats(@CurrentUser() user: JwtPayload): Promise<NovelStatsObject[]> {
    return this.paymentService.getNovelStats(user.userId);
  }
}
