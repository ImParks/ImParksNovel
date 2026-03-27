import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminActionType, BadgeType, ReportStatus, ReportTargetType, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminRepository } from '../infrastructure/admin.repository';
import {
  AdminDashboardObject,
  ContentReviewObject,
  UserPenaltyObject,
  NoticeObject,
  NoticeConnection,
  UserBadgeObject,
  AdminReportObject,
  AdminReportConnection,
} from './dto/admin.object';
import {
  ContentActionInput,
  UserActionInput,
  ReportResolutionInput,
  CreateNoticeInput,
  UpdateNoticeInput,
  AwardBadgeInput,
  NoticeCategoryEnum,
} from './dto/admin.input';

// ──────────────────────────────────────────────
// Constants & Helpers
// ──────────────────────────────────────────────

const SUSPEND_DURATION_MAP: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
};

function calculateSuspendUntil(durationKey?: string): Date | undefined {
  if (!durationKey || !(durationKey in SUSPEND_DURATION_MAP)) {
    return undefined;
  }
  const days = SUSPEND_DURATION_MAP[durationKey];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ──────────────────────────────────────────────
  // Dashboard
  // ──────────────────────────────────────────────

  async getDashboard(): Promise<AdminDashboardObject> {
    const stats = await this.adminRepository.getDashboardStats();
    return {
      pendingReports: stats.pendingReports,
      todayNewUsers: stats.todayNewUsers,
      todayNewNovels: stats.todayNewNovels,
      todayRevenue: stats.todayRevenue,
      activeUsers: stats.activeUsers,
    };
  }

  // ──────────────────────────────────────────────
  // Report Management
  // ──────────────────────────────────────────────

  async getReports(
    status?: ReportStatus,
    targetType?: ReportTargetType,
    first?: number,
    after?: string,
  ): Promise<AdminReportConnection> {
    const connection = await this.adminRepository.findReportsWithPagination(status, targetType, {
      first: first ?? 20,
      after,
    });

    return {
      edges: connection.edges.map((edge) => ({
        node: this.mapReportToObject(edge.node),
        cursor: edge.cursor,
      })),
      pageInfo: connection.pageInfo,
      totalCount: connection.totalCount,
    };
  }

  async resolveReport(
    adminId: string,
    reportId: string,
    input: ReportResolutionInput,
  ): Promise<AdminReportObject> {
    const report = await this.adminRepository.findReportById(reportId);
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);

    const updated = await this.adminRepository.updateReport(reportId, {
      status: input.status as ReportStatus,
      reviewerId: adminId,
      resolution: input.adminNote || '',
    });

    return this.mapReportToObject(updated);
  }

  // ──────────────────────────────────────────────
  // Content Action (콘텐츠 조치)
  // ──────────────────────────────────────────────

  async takeContentAction(
    adminId: string,
    input: ContentActionInput,
  ): Promise<ContentReviewObject> {
    const action = await this.adminRepository.createAdminAction({
      adminId,
      actionType: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
    });

    // Handle CONTENT_HIDE, CONTENT_DELETE separately based on targetType
    if (input.action === AdminActionType.CONTENT_HIDE || input.action === AdminActionType.CONTENT_DELETE) {
      if (input.targetType === 'NOVEL') {
        await this.prisma.novel.update({
          where: { id: input.targetId },
          data: { status: input.action === AdminActionType.CONTENT_DELETE ? 'HIDDEN' : 'HIDDEN' },
        });
      } else if (input.targetType === 'EPISODE') {
        await this.prisma.episode.update({
          where: { id: input.targetId },
          data: { status: input.action === AdminActionType.CONTENT_DELETE ? 'DRAFT' : 'DRAFT' },
        });
      } else if (input.targetType === 'COMMENT') {
        await this.prisma.comment.update({
          where: { id: input.targetId },
          data: { isHidden: true, hiddenReason: input.reason },
        });
      }
    }

    return {
      id: action.id,
      targetType: action.targetType,
      targetId: action.targetId,
      action: action.actionType,
      reason: action.reason,
      adminId: action.adminId,
      createdAt: action.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // User Action (사용자 제재)
  // ──────────────────────────────────────────────

  async takeUserAction(adminId: string, input: UserActionInput): Promise<UserPenaltyObject> {
    const user = await this.adminRepository.findUserById(input.userId);
    if (!user) throw new NotFoundException(`User ${input.userId} not found`);

    const suspendUntil = calculateSuspendUntil(input.duration);
    const action = await this.adminRepository.createAdminAction({
      adminId,
      actionType: input.action,
      targetType: 'USER',
      targetId: input.userId,
      reason: input.reason,
      suspendUntil,
    });

    // Update user status based on action
    if (
      input.action === AdminActionType.SUSPEND_1D ||
      input.action === AdminActionType.SUSPEND_7D ||
      input.action === AdminActionType.SUSPEND_30D ||
      input.action === AdminActionType.PERMANENT_BAN
    ) {
      await this.adminRepository.updateUserStatus(input.userId, 'SUSPENDED');
    }

    return {
      id: action.id,
      userId: input.userId,
      action: action.actionType,
      reason: action.reason,
      duration: input.duration,
      expiresAt: suspendUntil,
      createdAt: action.createdAt,
    };
  }

  async liftUserPenalty(adminId: string, userId: string): Promise<void> {
    const user = await this.adminRepository.findUserById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    await this.adminRepository.updateUserStatus(userId, 'ACTIVE');
    await this.adminRepository.createAdminAction({
      adminId,
      actionType: AdminActionType.RESTORE,
      targetType: 'USER',
      targetId: userId,
      reason: 'Penalty lifted',
    });
  }

  // ──────────────────────────────────────────────
  // Content Review History
  // ──────────────────────────────────────────────

  async getContentReviewHistory(targetType: string, targetId: string) {
    const actions = await this.adminRepository.findActionsByTarget(targetType, targetId);
    return actions.map((action) => ({
      id: action.id,
      targetType: action.targetType,
      targetId: action.targetId,
      action: action.actionType,
      reason: action.reason,
      adminId: action.adminId,
      createdAt: action.createdAt,
    }));
  }

  async getUserPenaltyHistory(userId: string) {
    const actions = await this.adminRepository.findActionsByUser(userId);
    return actions.map((action) => ({
      id: action.id,
      userId,
      action: action.actionType,
      reason: action.reason,
      duration: action.suspendUntil ? this.calculateDuration(action.suspendUntil) : undefined,
      expiresAt: action.suspendUntil,
      createdAt: action.createdAt,
    }));
  }

  private calculateDuration(expiresAt: Date): string | undefined {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    for (const [key, duration] of Object.entries(SUSPEND_DURATION_MAP)) {
      if (days === duration) return key;
    }
    return undefined;
  }

  // ──────────────────────────────────────────────
  // Notice (공지사항)
  // ──────────────────────────────────────────────

  async getNotices(
    category?: string,
    isPublished?: boolean,
    first?: number,
    after?: string,
  ): Promise<NoticeConnection> {
    const connection = await this.adminRepository.findNoticesWithPagination(category, isPublished, {
      first: first ?? 20,
      after,
    });

    return {
      edges: connection.edges.map((edge) => ({
        node: this.mapNoticeToObject(edge.node),
        cursor: edge.cursor,
      })),
      pageInfo: connection.pageInfo,
      totalCount: connection.totalCount,
    };
  }

  async getPublishedNotices(
    category?: string,
    first?: number,
    after?: string,
  ): Promise<NoticeConnection> {
    return this.getNotices(category, true, first, after);
  }

  async getNotice(id: string): Promise<NoticeObject> {
    const notice = await this.adminRepository.findNoticeById(id);
    if (!notice) throw new NotFoundException(`Notice ${id} not found`);
    return this.mapNoticeToObject(notice);
  }

  async createNotice(adminId: string, input: CreateNoticeInput): Promise<NoticeObject> {
    const notice = await this.adminRepository.createAnnouncement({
      authorId: adminId,
      title: input.title,
      content: input.content,
      category: input.category,
      isPinned: input.isPinned ?? false,
      targetRoles: (input.targetRoles ?? []) as UserRole[],
    });
    return this.mapNoticeToObject(notice);
  }

  async updateNotice(adminId: string, id: string, input: UpdateNoticeInput): Promise<NoticeObject> {
    const notice = await this.adminRepository.findNoticeById(id);
    if (!notice) throw new NotFoundException(`Notice ${id} not found`);
    if (notice.authorId !== adminId) throw new ForbiddenException('Cannot update notice created by another admin');

    const updated = await this.adminRepository.updateAnnouncement(id, {
      title: input.title,
      content: input.content,
      category: input.category,
      isPinned: input.isPinned,
      targetRoles: input.targetRoles,
      updatedAt: new Date(),
    });
    return this.mapNoticeToObject(updated);
  }

  async deleteNotice(adminId: string, id: string): Promise<void> {
    const notice = await this.adminRepository.findNoticeById(id);
    if (!notice) throw new NotFoundException(`Notice ${id} not found`);
    if (notice.authorId !== adminId) throw new ForbiddenException('Cannot delete notice created by another admin');

    await this.adminRepository.deleteAnnouncement(id);
  }

  async publishNotice(adminId: string, id: string): Promise<NoticeObject> {
    const notice = await this.adminRepository.findNoticeById(id);
    if (!notice) throw new NotFoundException(`Notice ${id} not found`);
    if (notice.authorId !== adminId) throw new ForbiddenException('Cannot publish notice created by another admin');

    const updated = await this.adminRepository.publishAnnouncement(id);
    return this.mapNoticeToObject(updated);
  }

  // ──────────────────────────────────────────────
  // Badge Management
  // ──────────────────────────────────────────────

  async getBadges(): Promise<string[]> {
    return this.adminRepository.findAllBadgeTypes();
  }

  async getUserBadges(userId: string): Promise<UserBadgeObject[]> {
    const badges = await this.adminRepository.findBadgesByTarget('USER', userId, true);
    return badges.map(this.mapBadgeToObject);
  }

  async awardBadge(adminId: string, input: AwardBadgeInput): Promise<UserBadgeObject> {
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
    const badge = await this.adminRepository.createUserBadge({
      targetType: input.targetType,
      targetId: input.targetId,
      badgeType: input.badgeType,
      customName: input.customName,
      reason: input.reason,
      expiresAt,
      grantedBy: adminId,
    });
    return this.mapBadgeToObject(badge);
  }

  async revokeBadge(adminId: string, badgeId: string, reason: string): Promise<UserBadgeObject> {
    const badge = await this.adminRepository.findBadgeById(badgeId);
    if (!badge) throw new NotFoundException(`Badge ${badgeId} not found`);

    const revoked = await this.adminRepository.revokeBadge(badgeId, adminId, reason);
    return this.mapBadgeToObject(revoked);
  }

  // ──────────────────────────────────────────────
  // User Role Management
  // ──────────────────────────────────────────────

  async changeUserRole(adminId: string, userId: string, role: UserRole): Promise<void> {
    // Only SUPER_ADMIN can change roles
    const admin = await this.adminRepository.findUserById(adminId);
    if (admin?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can change user roles');
    }

    const user = await this.adminRepository.findUserById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    await this.adminRepository.updateUserRole(userId, role);
  }

  // ──────────────────────────────────────────────
  // Mappers
  // ──────────────────────────────────────────────

  private mapNoticeToObject(notice: any): NoticeObject {
    return {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category as NoticeCategoryEnum,
      isPinned: notice.isPinned,
      isPublished: notice.isPublished,
      publishedAt: notice.publishedAt,
      createdAt: notice.createdAt,
    };
  }

  private mapBadgeToObject(badge: any): UserBadgeObject {
    return {
      id: badge.id,
      targetType: badge.targetType,
      targetId: badge.targetId,
      badgeType: badge.badgeType as BadgeType,
      customName: badge.customName,
      reason: badge.reason,
      expiresAt: badge.expiresAt,
      isActive: badge.isActive,
      createdAt: badge.createdAt,
    };
  }

  private mapReportToObject(report: any): AdminReportObject {
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      status: report.status,
      reporterId: report.reporterId,
      adminNote: report.resolution,
      createdAt: report.createdAt,
    };
  }
}
