import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../../../common/types/context';
import { UserRepository } from '../infrastructure/user.repository';
import {
  ApplyForAuthorInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  UpdateAuthorProfileInput,
  UpdateProfileInput,
} from './dto/user.input';
import { AuthResponse, AuthorProfileObject, UserObject } from './dto/user.object';

const BCRYPT_ROUNDS = 10;
const LOGIN_FAIL_LIMIT = 5;
const LOGIN_BLOCK_MINUTES = 30;
const NICKNAME_CHANGE_DAYS = 30;
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const PASSWORD_RESET_TOKEN_EXPIRES_MINUTES = 30;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  // ──────────────────────────────────────────────
  // Auth
  // ──────────────────────────────────────────────

  async signUp(input: SignUpInput): Promise<AuthResponse> {
    if (!input.agreeToTerms || !input.agreeToPrivacy) {
      throw new BadRequestException('이용약관 및 개인정보처리방침에 동의해야 합니다.');
    }

    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const existingNickname = await this.userRepository.findByNickname(input.nickname);
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      nickname: input.nickname,
    });

    const tokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await this.userRepository.createSession({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return { ...tokens, user: this.toUserObject(user) };
  }

  async signIn(input: SignInInput): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status === UserStatus.WITHDRAWN) {
      throw new UnauthorizedException('탈퇴한 계정입니다.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('정지된 계정입니다.');
    }

    if (user.loginBlockedUntil && user.loginBlockedUntil > new Date()) {
      const remaining = Math.ceil(
        (user.loginBlockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `로그인이 일시적으로 차단되었습니다. ${remaining}분 후 다시 시도해 주세요.`,
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('소셜 로그인 계정입니다. 비밀번호 로그인을 지원하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      const newFailCount = user.loginFailCount + 1;

      if (newFailCount >= LOGIN_FAIL_LIMIT) {
        const blockedUntil = new Date(Date.now() + LOGIN_BLOCK_MINUTES * 60 * 1000);
        await this.userRepository.update(user.id, {
          loginFailCount: newFailCount,
          loginBlockedUntil: blockedUntil,
        });
        throw new UnauthorizedException(
          `로그인 시도 횟수를 초과했습니다. ${LOGIN_BLOCK_MINUTES}분 동안 로그인이 차단됩니다.`,
        );
      }

      await this.userRepository.update(user.id, { loginFailCount: newFailCount });
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    await this.userRepository.update(user.id, {
      loginFailCount: 0,
      loginBlockedUntil: null,
      lastLoginAt: new Date(),
    });

    const tokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await this.userRepository.createSession({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return { ...tokens, user: this.toUserObject(user) };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const session = await this.userRepository.findSessionByToken(token);
    if (!session) {
      throw new UnauthorizedException('유효하지 않거나 만료된 리프레시 토큰입니다.');
    }

    if (session.expiresAt < new Date()) {
      await this.userRepository.deleteSession(token);
      throw new UnauthorizedException('리프레시 토큰이 만료되었습니다. 다시 로그인해 주세요.');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: undefined, // uses module-level secret
      });
    } catch {
      await this.userRepository.deleteSession(token);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.userRepository.deleteSession(token);
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // Rotate: delete old session, issue new tokens
    await this.userRepository.deleteSession(token);

    const newTokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await this.userRepository.createSession({
      userId: user.id,
      token: newTokens.refreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return { ...newTokens, user: this.toUserObject(user) };
  }

  async signOut(refreshToken: string): Promise<boolean> {
    await this.userRepository.deleteSession(refreshToken);
    return true;
  }

  // ──────────────────────────────────────────────
  // User queries
  // ──────────────────────────────────────────────

  async getMe(userId: string): Promise<UserObject> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return this.toUserObject(user);
  }

  async getUser(id: string): Promise<UserObject | null> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return this.toUserObject(user);
  }

  // ──────────────────────────────────────────────
  // Profile
  // ──────────────────────────────────────────────

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserObject> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (input.nickname && input.nickname !== user.nickname) {
      if (user.nicknameChangedAt) {
        const daysSinceLastChange =
          (Date.now() - user.nicknameChangedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < NICKNAME_CHANGE_DAYS) {
          const daysRemaining = Math.ceil(NICKNAME_CHANGE_DAYS - daysSinceLastChange);
          throw new BadRequestException(
            `닉네임은 ${NICKNAME_CHANGE_DAYS}일에 한 번만 변경할 수 있습니다. ${daysRemaining}일 후 변경 가능합니다.`,
          );
        }
      }

      const existing = await this.userRepository.findByNickname(input.nickname);
      if (existing) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
    }

    const updated = await this.userRepository.update(userId, {
      ...(input.nickname !== undefined && { nickname: input.nickname }),
      ...(input.nickname !== undefined &&
        input.nickname !== user.nickname && { nicknameChangedAt: new Date() }),
      ...(input.profileImageUrl !== undefined && { profileImageUrl: input.profileImageUrl }),
      ...(input.bio !== undefined && { bio: input.bio }),
    });

    return this.toUserObject(updated);
  }

  // ──────────────────────────────────────────────
  // Author
  // ──────────────────────────────────────────────

  async applyForAuthor(userId: string, input: ApplyForAuthorInput): Promise<AuthorProfileObject> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role !== UserRole.READER) {
      throw new BadRequestException('이미 작가 신청이 완료되었거나 작가 권한을 보유하고 있습니다.');
    }

    const existingProfile = await this.userRepository.findAuthorProfile(userId);
    if (existingProfile) {
      throw new ConflictException('이미 작가 프로필이 존재합니다.');
    }

    const existingAuthorName = await this.prismaAuthorNameExists(input.authorName);
    if (existingAuthorName) {
      throw new ConflictException('이미 사용 중인 작가명입니다.');
    }

    await this.userRepository.update(userId, { role: UserRole.AUTHOR });

    const profile = await this.userRepository.createAuthorProfile({
      userId,
      authorName: input.authorName,
      authorBio: input.authorBio,
    });

    return this.toAuthorProfileObject(profile);
  }

  async updateAuthorProfile(
    userId: string,
    input: UpdateAuthorProfileInput,
  ): Promise<AuthorProfileObject> {
    const profile = await this.userRepository.findAuthorProfile(userId);
    if (!profile) {
      throw new NotFoundException('작가 프로필을 찾을 수 없습니다.');
    }

    const updated = await this.userRepository.updateAuthorProfile(userId, {
      ...(input.authorName !== undefined && { authorName: input.authorName }),
      ...(input.authorBio !== undefined && { authorBio: input.authorBio }),
      ...(input.bankName !== undefined && { bankName: input.bankName }),
      ...(input.bankAccount !== undefined && { bankAccount: input.bankAccount }),
      ...(input.accountHolder !== undefined && { accountHolder: input.accountHolder }),
    });

    return this.toAuthorProfileObject(updated);
  }

  async getAuthorProfile(userId: string): Promise<AuthorProfileObject | null> {
    const profile = await this.userRepository.findAuthorProfile(userId);
    if (!profile) return null;
    return this.toAuthorProfileObject(profile);
  }

  // ──────────────────────────────────────────────
  // Password reset
  // ──────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);

    // Always return true to avoid email enumeration
    if (!user || !user.passwordHash) return true;

    const resetToken = randomUUID();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    );

    // Store reset token as a special session with token prefixed for identification
    await this.userRepository.createSession({
      userId: user.id,
      token: `reset:${resetToken}`,
      expiresAt,
    });

    // TODO: send resetToken via email (email service integration in Phase 2)

    return true;
  }

  async resetPassword(input: ResetPasswordInput): Promise<boolean> {
    const session = await this.userRepository.findSessionByToken(`reset:${input.token}`);
    if (!session) {
      throw new BadRequestException('유효하지 않거나 만료된 비밀번호 재설정 토큰입니다.');
    }

    if (session.expiresAt < new Date()) {
      await this.userRepository.deleteSession(`reset:${input.token}`);
      throw new BadRequestException('비밀번호 재설정 토큰이 만료되었습니다. 다시 요청해 주세요.');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

    await this.userRepository.update(session.userId, { passwordHash: newPasswordHash });
    await this.userRepository.deleteSession(`reset:${input.token}`);

    return true;
  }

  // ──────────────────────────────────────────────
  // Account deletion
  // ──────────────────────────────────────────────

  async deleteAccount(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.userRepository.softDelete(userId);

    // TODO: schedule hard delete after 30 days (scheduler/queue in Phase 2)

    return true;
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private generateTokenPair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
    return { accessToken, refreshToken };
  }

  private getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  private toUserObject(user: {
    id: string;
    email: string;
    nickname: string;
    profileImageUrl?: string | null;
    bio?: string | null;
    role: UserRole;
    status: UserStatus;
    isAdultVerified: boolean;
    emailVerifiedAt?: Date | null;
    lastLoginAt?: Date | null;
    nicknameChangedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserObject {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl ?? undefined,
      bio: user.bio ?? undefined,
      role: user.role,
      status: user.status,
      isAdultVerified: user.isAdultVerified,
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
      lastLoginAt: user.lastLoginAt ?? undefined,
      nicknameChangedAt: user.nicknameChangedAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toAuthorProfileObject(profile: {
    id: string;
    userId: string;
    authorName: string;
    authorBio?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    accountHolder?: string | null;
    taxId?: string | null;
  }): AuthorProfileObject {
    return {
      id: profile.id,
      userId: profile.userId,
      authorName: profile.authorName,
      authorBio: profile.authorBio ?? undefined,
      bankName: profile.bankName ?? undefined,
      bankAccount: profile.bankAccount ?? undefined,
      accountHolder: profile.accountHolder ?? undefined,
      taxId: profile.taxId ?? undefined,
    };
  }

  private async prismaAuthorNameExists(authorName: string): Promise<boolean> {
    const profile = await this.userRepository.findAuthorProfileByAuthorName(authorName);
    return !!profile;
  }
}
