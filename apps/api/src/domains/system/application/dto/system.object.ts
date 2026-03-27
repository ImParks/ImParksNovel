import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';
import { PageInfo } from '../../../novel/application/dto/novel.object';
export { PageInfo };

registerEnumType(NotificationType, { name: 'NotificationType' });

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

@ObjectType()
export class NotificationObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field(() => String, { nullable: true })
  relatedType?: string;

  @Field(() => ID, { nullable: true })
  relatedId?: string;

  @Field(() => String, { nullable: true, description: 'JSON serialized extra data' })
  data?: string;

  @Field()
  isRead: boolean;

  @Field(() => Date, { nullable: true })
  readAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class NotificationEdge {
  @Field()
  cursor: string;

  @Field(() => NotificationObject)
  node: NotificationObject;
}


@ObjectType()
export class NotificationConnection {
  @Field(() => [NotificationEdge])
  edges: NotificationEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Genre
// ---------------------------------------------------------------------------

@ObjectType()
export class GenreObject {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field()
  isAdultOnly: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field()
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

@ObjectType()
export class TagObject {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => Int)
  useCount: number;
}
