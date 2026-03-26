import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtPayload } from '../../../common/types/context';
import { UserService } from '../application/user.service';
import {
  ApplyForAuthorInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdateAuthorProfileInput,
  UpdateProfileInput,
} from '../application/dto/user.input';
import {
  AuthorProfileObject,
  AuthResponse,
  UserObject,
} from '../application/dto/user.object';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // ──────────────────────────────────────────────
  // Queries
  // ──────────────────────────────────────────────

  @Query(() => UserObject)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload): Promise<UserObject> {
    return this.userService.getMe(currentUser.userId);
  }

  @Query(() => UserObject, { nullable: true })
  async user(@Args('id', { type: () => ID }) id: string): Promise<UserObject | null> {
    return this.userService.getUser(id);
  }

  @Query(() => AuthorProfileObject, { nullable: true })
  async authorProfile(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<AuthorProfileObject | null> {
    return this.userService.getAuthorProfile(userId);
  }

  // ──────────────────────────────────────────────
  // Auth mutations
  // ──────────────────────────────────────────────

  @Mutation(() => AuthResponse)
  async signUp(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    return this.userService.signUp(input);
  }

  @Mutation(() => AuthResponse)
  async signIn(@Args('input') input: SignInInput): Promise<AuthResponse> {
    return this.userService.signIn(input);
  }

  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('token') token: string,
  ): Promise<AuthResponse> {
    return this.userService.refreshToken(token);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async signOut(
    @Args('refreshToken') refreshToken: string,
  ): Promise<boolean> {
    return this.userService.signOut(refreshToken);
  }

  // ──────────────────────────────────────────────
  // Profile mutations
  // ──────────────────────────────────────────────

  @Mutation(() => UserObject)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserObject> {
    return this.userService.updateProfile(currentUser.userId, input);
  }

  // ──────────────────────────────────────────────
  // Author mutations
  // ──────────────────────────────────────────────

  @Mutation(() => AuthorProfileObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.READER)
  async applyForAuthor(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: ApplyForAuthorInput,
  ): Promise<AuthorProfileObject> {
    return this.userService.applyForAuthor(currentUser.userId, input);
  }

  @Mutation(() => AuthorProfileObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateAuthorProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Args('input') input: UpdateAuthorProfileInput,
  ): Promise<AuthorProfileObject> {
    return this.userService.updateAuthorProfile(currentUser.userId, input);
  }

  // ──────────────────────────────────────────────
  // Password mutations
  // ──────────────────────────────────────────────

  @Mutation(() => Boolean)
  async requestPasswordReset(
    @Args('email') email: string,
  ): Promise<boolean> {
    return this.userService.requestPasswordReset(email);
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<boolean> {
    return this.userService.resetPassword(input);
  }

  // ──────────────────────────────────────────────
  // Account deletion
  // ──────────────────────────────────────────────

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<boolean> {
    return this.userService.deleteAccount(currentUser.userId);
  }
}
