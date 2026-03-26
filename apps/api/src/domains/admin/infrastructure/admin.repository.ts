import { Injectable } from '@nestjs/common';
import { AdminActionType, BadgeType, Prisma, ReportStatus, ReportTargetType, UserRole, UserStatus } from '@prisma/client';
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
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // AdminAction (콘텐츠/사용자 조치)
  // ──────────────────────────────────────────────

  async createAdminAction(data: {
    adminId: string;
    actionType: AdminActionType;
    targetType: string;
    targetId: string;
    reason: string;
    details?: Prisma.InputJsonValue;
    suspendUntil?: Date;
  }) {
    return this.prisma.adminAction.create({ data });
  }

  async findActionsByTarget(targetType: string, targetId: string) {
    return this.prisma.adminAction.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActionsByUser(userId: string) {
    return this.prisma.adminAction.findMany({
      where: { targetType: 'USER', targetId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // Announcement (공지사항)
  // ──────────────────────────────────────────────

  async createAnnouncement(data: {
    authorId: string;
    title: string;
    content: string;
    category: string;
    isPinned?: boolean;
    targetRoles?: UserRole[];
  }) {
    return this.prisma.announcement.create({
      data: {
        authorId: data.authorId,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned ?? false,
        isPublished: false,
        targetRoles: data.targetRoles ?? [],
      },
    });
  }

  async findNoticesWithPagination(
    category?: string,
    isPublished?: boolean,
    pagination?: PaginationArgs,
  ) {
    const take = (pagination?.first ?? 20) + 1;
    const afterCursor = pagination?.after ? decodeCursor(pagination.after) : undefined;

    const where: Prisma.AnnouncementWhereInput = {
      ...(category && { /* Note: category is stored as string, filter if needed */ }),
      ...(isPublished !== undefined && { isPublished }),
      ...(afterCursor && { id: { gt: afterCursor } }),
      deletedAt: null,
    };

    const items = await this.prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    const hasNextPage = items.length > (pagination?.first ?? 20);
    const edges = items.slice(0, pagination?.first ?? 20).map((item) => ({
      node: item,
      cursor: encodeCursor(item.id),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
      },
      totalCount: await this.prisma.announcement.count({
        where: { ...where, deletedAt: null },
      }),
    };
  }

  async findNoticeById(id: string) {
    return this.prisma.announcement.findUnique({
      where: { id },
    });
  }

  async updateAnnouncement(id: string, data: Partial<any>) {
    return this.prisma.announcement.update({
      where: { id },
      data,
    });
  }

  async deleteAnnouncement(id: string) {
    return this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async publishAnnouncement(id: string) {
    return this.prisma.announcement.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────────
  // UserBadge (배지)
  // ──────────────────────────────────────────────

  async createUserBadge(data: {
    targetType: string;
    targetId: string;
    badgeType: BadgeType;
    customName?: string;
    customIcon?: string;
    reason: string;
    expiresAt?: Date;
    grantedBy: string;
  }) {
    return this.prisma.userBadge.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  async findBadgesByTarget(targetType: string, targetId: string, isActive?: boolean) {
    return this.prisma.userBadge.findMany({
      where: {
        targetType,
        targetId,
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBadgeById(id: string) {
    return this.prisma.userBadge.findUnique({
      where: { id },
    });
  }

  async revokeBadge(id: string, revokedBy: string, reason: string) {
    return this.prisma.userBadge.update({
      where: { id },
      data: {
        isActive: false,
        revokedBy,
        revokedAt: new Date(),
      },
    });
  }

  async findAllBadgeTypes() {
    // Return all BadgeType enum values
    return Object.values(BadgeType);
  }

  // ──────────────────────────────────────────────
  // Dashboard
  // ──────────────────────────────────────────────

  async getDashboardStats() {
    // Pending reports count
    const pendingReports = await this.prisma.report.count({
      where: { status: 'PENDING' },
    });

    // Today's new users
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayNewUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Today's new novels
    const todayNewNovels = await this.prisma.novel.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Today's revenue (CoinTransaction CHARGE)
    const todayRevenue = await this.prisma.coinTransaction.aggregate({
      where: {
        type: 'CHARGE',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: { amount: true },
    });

    // Active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await this.prisma.readingHistory.findMany({
      distinct: ['userId'],
      where: {
        lastReadAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: { userId: true },
    });

    return {
      pendingReports,
      todayNewUsers,
      todayNewNovels,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      activeUsers: activeUsers.length,
    };
  }

  // ──────────────────────────────────────────────
  // Report (Content 도메인과 연동)
  // ──────────────────────────────────────────────

  async findReportsWithPagination(
    status?: ReportStatus,
    targetType?: ReportTargetType,
    pagination?: PaginationArgs,
  ) {
    const take = (pagination?.first ?? 20) + 1;
    const afterCursor = pagination?.after ? decodeCursor(pagination.after) : undefined;

    const where: Prisma.ReportWhereInput = {
      ...(status && { status }),
      ...(targetType && { targetType }),
      ...(afterCursor && { id: { gt: afterCursor } }),
    };

    const items = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    const hasNextPage = items.length > (pagination?.first ?? 20);
    const edges = items.slice(0, pagination?.first ?? 20).map((item) => ({
      node: item,
      cursor: encodeCursor(item.id),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
      },
      totalCount: await this.prisma.report.count({ where }),
    };
  }

  async findReportById(id: string) {
    return this.prisma.report.findUnique({
      where: { id },
    });
  }

  async updateReport(id: string, data: { status?: ReportStatus; reviewerId?: string; resolution?: string }) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: data.status,
        reviewerId: data.reviewerId,
        resolution: data.resolution,
        reviewedAt: new Date(),
      },
    });
  }

  // ──────────────────────────────────────────────
  // User (역할 변경)
  // ──────────────────────────────────────────────

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateUserRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateUserStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }
}
