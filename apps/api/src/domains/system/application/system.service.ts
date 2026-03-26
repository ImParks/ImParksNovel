import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import {
  SystemRepository,
  FindNotificationsOptions,
  CreateNotificationData,
} from '../infrastructure/system.repository';
import {
  NotificationConnection,
  NotificationEdge,
  NotificationObject,
  PageInfo,
  GenreObject,
  TagObject,
} from './dto/system.object';

@Injectable()
export class SystemService {
  constructor(private readonly systemRepository: SystemRepository) {}

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  async getNotifications(
    userId: string,
    options: FindNotificationsOptions,
  ): Promise<NotificationConnection> {
    const first = options.first ?? 20;
    const { items, hasNextPage } = await this.systemRepository.findNotifications(
      userId,
      { ...options, first },
    );

    const [totalCount, unreadCount] = await Promise.all([
      this.systemRepository.countNotifications(userId),
      this.systemRepository.countUnreadNotifications(userId),
    ]);

    const edges: NotificationEdge[] = items.map((n) => ({
      cursor: SystemRepository.encodeCursor(n.createdAt),
      node: this.mapNotification(n),
    }));

    const pageInfo: PageInfo = {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
    };

    return { edges, pageInfo, totalCount, unreadCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.systemRepository.countUnreadNotifications(userId);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationObject> {
    await this.assertOwnership(id, userId);
    const updated = await this.systemRepository.markAsRead(id, userId);
    return this.mapNotification(updated);
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.systemRepository.markAllAsRead(userId);
    return true;
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    await this.assertOwnership(id, userId);
    await this.systemRepository.deleteNotification(id, userId);
    return true;
  }

  /**
   * Called by other domains to push a notification to a user.
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationObject> {
    const notification = await this.systemRepository.createNotification(data);
    return this.mapNotification(notification);
  }

  // ---------------------------------------------------------------------------
  // Genres
  // ---------------------------------------------------------------------------

  async getGenres(includeInactive = false): Promise<GenreObject[]> {
    const rows = await this.systemRepository.findGenres(includeInactive);
    return rows.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description ?? undefined,
      isAdultOnly: g.isAdultOnly,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
    }));
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  async getTags(query?: string, first?: number): Promise<TagObject[]> {
    const rows = await this.systemRepository.findTags(query, first);
    return rows.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      useCount: t.useCount,
    }));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async assertOwnership(id: string, userId: string): Promise<void> {
    const notification = await this.systemRepository.findNotificationById(id, userId);
    if (!notification) {
      throw new NotFoundException('NOTIFICATION_001: 알림을 찾을 수 없음');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('NOTIFICATION_002: 다른 사용자의 알림');
    }
  }

  private mapNotification(n: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedType?: string | null;
    relatedId?: string | null;
    data?: unknown;
    isRead: boolean;
    readAt?: Date | null;
    createdAt: Date;
  }): NotificationObject {
    const obj = new NotificationObject();
    obj.id = n.id;
    obj.userId = n.userId;
    obj.type = n.type;
    obj.title = n.title;
    obj.message = n.message;
    obj.relatedType = n.relatedType ?? undefined;
    obj.relatedId = n.relatedId ?? undefined;
    obj.data = n.data != null ? JSON.stringify(n.data) : undefined;
    obj.isRead = n.isRead;
    obj.readAt = n.readAt ?? undefined;
    obj.createdAt = n.createdAt;
    return obj;
  }
}
