import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async findByNickname(nickname: string) {
    return this.prisma.user.findFirst({ where: { nickname, deletedAt: null } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    nickname: string;
    role?: UserRole;
  }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    const now = new Date();
    return this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.WITHDRAWN,
        deletedAt: now,
      },
    });
  }

  // Session methods

  async createSession(data: {
    userId: string;
    token: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return this.prisma.userSession.create({ data });
  }

  async deleteSession(token: string) {
    return this.prisma.userSession.deleteMany({ where: { token } });
  }

  async findSessionByToken(token: string) {
    return this.prisma.userSession.findUnique({ where: { token } });
  }

  async deleteExpiredSessions(userId: string) {
    return this.prisma.userSession.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }

  // AuthorProfile methods

  async createAuthorProfile(data: {
    userId: string;
    authorName: string;
    authorBio?: string;
  }) {
    return this.prisma.authorProfile.create({ data });
  }

  async updateAuthorProfile(
    userId: string,
    data: Prisma.AuthorProfileUpdateInput,
  ) {
    return this.prisma.authorProfile.update({ where: { userId }, data });
  }

  async findAuthorProfile(userId: string) {
    return this.prisma.authorProfile.findUnique({ where: { userId } });
  }

  async findAuthorProfileByAuthorName(authorName: string) {
    return this.prisma.authorProfile.findUnique({ where: { authorName } });
  }
}
