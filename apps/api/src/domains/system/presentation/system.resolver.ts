import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/types/context';
import { SystemService } from '../application/system.service';
import {
  NotificationObject,
  NotificationConnection,
  GenreObject,
  TagObject,
} from '../application/dto/system.object';

@Resolver()
export class SystemResolver {
  constructor(private readonly systemService: SystemService) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Paginated notification list for the authenticated user.
   * Cursor is base64-encoded ISO timestamp (createdAt).
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => NotificationConnection, { description: '내 알림 목록 (cursor pagination)' })
  async notifications(
    @CurrentUser() user: JwtPayload,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('isRead', { type: () => Boolean, nullable: true }) isRead?: boolean,
  ): Promise<NotificationConnection> {
    return this.systemService.getNotifications(user.userId, { first, after, isRead });
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Int, { description: '읽지 않은 알림 수' })
  async unreadNotificationCount(@CurrentUser() user: JwtPayload): Promise<number> {
    return this.systemService.getUnreadCount(user.userId);
  }

  /**
   * Genre master list. No auth required.
   */
  @Query(() => [GenreObject], { description: '장르 마스터 목록' })
  async genres(
    @Args('includeInactive', { type: () => Boolean, nullable: true, defaultValue: false })
    includeInactive: boolean,
  ): Promise<GenreObject[]> {
    return this.systemService.getGenres(includeInactive);
  }

  /**
   * Tag search. No auth required.
   */
  @Query(() => [TagObject], { description: '태그 목록 (검색 지원)' })
  async tags(
    @Args('query', { type: () => String, nullable: true }) query?: string,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 }) first?: number,
  ): Promise<TagObject[]> {
    return this.systemService.getTags(query, first);
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Mutation(() => NotificationObject, { description: '알림 읽음 처리' })
  async markNotificationAsRead(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<NotificationObject> {
    return this.systemService.markAsRead(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, { description: '모든 알림 읽음 처리' })
  async markAllNotificationsAsRead(@CurrentUser() user: JwtPayload): Promise<boolean> {
    return this.systemService.markAllAsRead(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, { description: '알림 삭제' })
  async deleteNotification(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.systemService.deleteNotification(id, user.userId);
  }
}
