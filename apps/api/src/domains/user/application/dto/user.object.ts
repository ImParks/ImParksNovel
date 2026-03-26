import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@prisma/client';

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(UserStatus, { name: 'UserStatus' });

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  nickname: string;

  @Field({ nullable: true })
  profileImageUrl?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => UserStatus)
  status: UserStatus;

  @Field()
  isAdultVerified: boolean;

  @Field({ nullable: true })
  emailVerifiedAt?: Date;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  nicknameChangedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AuthorProfileObject {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field()
  authorName: string;

  @Field({ nullable: true })
  authorBio?: string;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  accountHolder?: string;

  @Field({ nullable: true })
  taxId?: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => UserObject)
  user: UserObject;
}
