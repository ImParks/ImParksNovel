import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface FindNotificationsOptions {
  first?: number;
  after?: string;
  isRead?: boolean;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class SystemRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  async findNotifications(userId: string, options: FindNotificationsOptions) {
    const { first = 20, after, isRead } = options;

    const where: Record<string, unknown> = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    if (after) {
      where.createdAt = { lt: await this.cursorToDate(after) };
    }

    // Fetch first+1 to determine hasNextPage
    const rows = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: first + 1,
    });

    const hasNextPage = rows.length > first;
    const items = hasNextPage ? rows.slice(0, first) : rows;

    return { items, hasNextPage };
  }

  async countNotifications(userId: string, isRead?: boolean): Promise<number> {
    const where: Record<string, unknown> = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    return this.prisma.notification.count({ where });
  }

  async countUnreadNotifications(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async createNotification(data: CreateNotificationData) {
    return this.prisma.notification.create({
      data: {
        ...data,
        data: data.data !== undefined ? (data.data as object) : undefined,
      },
    });
  }

  async findNotificationById(id: string, userId: string) {
    return this.prisma.notification.findFirst({
      where: { id, userId },
    });
  }

  // ---------------------------------------------------------------------------
  // Genres
  // ---------------------------------------------------------------------------

  async findGenres(includeInactive = false) {
    return this.prisma.genre.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  async findTags(query?: string, first = 20) {
    return this.prisma.tag.findMany({
      where: {
        isBanned: false,
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
      },
      orderBy: { useCount: 'desc' },
      take: first,
    });
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Encode a notification's createdAt Date as a base64 cursor string.
   */
  static encodeCursor(createdAt: Date): string {
    return Buffer.from(createdAt.toISOString()).toString('base64');
  }

  /**
   * Decode a cursor back to a Date for use in WHERE clauses.
   */
  private async cursorToDate(cursor: string): Promise<Date> {
    const iso = Buffer.from(cursor, 'base64').toString('utf8');
    return new Date(iso);
  }
}
