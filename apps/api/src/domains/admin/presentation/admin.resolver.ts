import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtPayload } from '../../../common/types/context';
import { UserRole, ReportStatus, ReportTargetType } from '@prisma/client';
import { AdminService } from '../application/admin.service';
import {
  AdminDashboardObject,
  ContentReviewObject,
  UserPenaltyObject,
  NoticeObject,
  NoticeConnection,
  UserBadgeObject,
  ReportObject,
  ReportConnection,
} from '../application/dto/admin.object';
import {
  ContentActionInput,
  UserActionInput,
  ReportResolutionInput,
  CreateNoticeInput,
  UpdateNoticeInput,
  AwardBadgeInput,
  ChangeUserRoleInput,
  NoticeCategoryEnum,
} from '../application/dto/admin.input';

@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  // ──────────────────────────────────────────────
  // Dashboard Query
  // ──────────────────────────────────────────────

  @Query(() => AdminDashboardObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adminDashboard(): Promise<AdminDashboardObject> {
    return this.adminService.getDashboard();
  }

  // ──────────────────────────────────────────────
  // Report Queries & Mutations
  // ──────────────────────────────────────────────

  @Query(() => ReportConnection)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reports(
    @Args('status', { type: () => String, nullable: true }) status?: ReportStatus,
    @Args('targetType', { type: () => String, nullable: true }) targetType?: ReportTargetType,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<ReportConnection> {
    return this.adminService.getReports(status, targetType, first, after);
  }

  @Mutation(() => ReportObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async resolveReport(
    @CurrentUser() user: JwtPayload,
    @Args('reportId', { type: () => ID }) reportId: string,
    @Args('input') input: ReportResolutionInput,
  ): Promise<ReportObject> {
    return this.adminService.resolveReport(user.userId, reportId, input);
  }

  // ──────────────────────────────────────────────
  // Content Action Mutations
  // ──────────────────────────────────────────────

  @Mutation(() => ContentReviewObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async takeContentAction(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: ContentActionInput,
  ): Promise<ContentReviewObject> {
    return this.adminService.takeContentAction(user.userId, input);
  }

  @Query(() => [ContentReviewObject])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async contentReviewHistory(
    @Args('targetType') targetType: string,
    @Args('targetId', { type: () => ID }) targetId: string,
  ) {
    return this.adminService.getContentReviewHistory(targetType, targetId);
  }

  // ──────────────────────────────────────────────
  // User Action Mutations
  // ──────────────────────────────────────────────

  @Mutation(() => UserPenaltyObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async takeUserAction(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: UserActionInput,
  ): Promise<UserPenaltyObject> {
    return this.adminService.takeUserAction(user.userId, input);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async liftUserPenalty(
    @CurrentUser() user: JwtPayload,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<string> {
    await this.adminService.liftUserPenalty(user.userId, userId);
    return 'User penalty lifted';
  }

  @Query(() => [UserPenaltyObject])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async userPenaltyHistory(@Args('userId', { type: () => ID }) userId: string) {
    return this.adminService.getUserPenaltyHistory(userId);
  }

  // ──────────────────────────────────────────────
  // Notice Queries & Mutations
  // ──────────────────────────────────────────────

  @Query(() => NoticeConnection)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async notices(
    @Args('category', { type: () => NoticeCategoryEnum, nullable: true }) category?: NoticeCategoryEnum,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<NoticeConnection> {
    return this.adminService.getNotices(category, undefined, first, after);
  }

  @Query(() => NoticeConnection)
  async publishedNotices(
    @Args('category', { type: () => NoticeCategoryEnum, nullable: true }) category?: NoticeCategoryEnum,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first?: number,
    @Args('after', { nullable: true }) after?: string,
  ): Promise<NoticeConnection> {
    return this.adminService.getPublishedNotices(category, first, after);
  }

  @Query(() => NoticeObject)
  async notice(@Args('id', { type: () => ID }) id: string): Promise<NoticeObject> {
    return this.adminService.getNotice(id);
  }

  @Mutation(() => NoticeObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createNotice(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateNoticeInput,
  ): Promise<NoticeObject> {
    return this.adminService.createNotice(user.userId, input);
  }

  @Mutation(() => NoticeObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateNotice(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateNoticeInput,
  ): Promise<NoticeObject> {
    return this.adminService.updateNotice(user.userId, id, input);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteNotice(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<string> {
    await this.adminService.deleteNotice(user.userId, id);
    return 'Notice deleted';
  }

  @Mutation(() => NoticeObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async publishNotice(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NoticeObject> {
    return this.adminService.publishNotice(user.userId, id);
  }

  // ──────────────────────────────────────────────
  // Badge Queries & Mutations
  // ──────────────────────────────────────────────

  @Query(() => [String])
  async badgeTypes(): Promise<string[]> {
    return this.adminService.getBadges();
  }

  @Query(() => [UserBadgeObject])
  async userBadges(@Args('userId', { type: () => ID }) userId: string): Promise<UserBadgeObject[]> {
    return this.adminService.getUserBadges(userId);
  }

  @Mutation(() => UserBadgeObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async awardBadge(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: AwardBadgeInput,
  ): Promise<UserBadgeObject> {
    return this.adminService.awardBadge(user.userId, input);
  }

  @Mutation(() => UserBadgeObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async revokeBadge(
    @CurrentUser() user: JwtPayload,
    @Args('badgeId', { type: () => ID }) badgeId: string,
    @Args('reason') reason: string,
  ): Promise<UserBadgeObject> {
    return this.adminService.revokeBadge(user.userId, badgeId, reason);
  }

  // ──────────────────────────────────────────────
  // User Management (SUPER_ADMIN only)
  // ──────────────────────────────────────────────

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async changeUserRole(
    @CurrentUser() user: JwtPayload,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role', { type: () => String }) role: string,
  ): Promise<string> {
    await this.adminService.changeUserRole(user.userId, userId, role as UserRole);
    return `User role changed to ${role}`;
  }
}
