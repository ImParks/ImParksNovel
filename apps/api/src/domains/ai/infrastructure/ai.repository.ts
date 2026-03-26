import { Injectable } from '@nestjs/common';
import {
  AIFeatureType,
  AITokenTransactionType,
  Prisma,
} from '@prisma/client';
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
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // AITokenWallet
  // ──────────────────────────────────────────────

  /**
   * Find a wallet by userId
   */
  async findWalletByUserId(userId: string) {
    return this.prisma.aITokenWallet.findUnique({
      where: { userId },
    });
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId: string) {
    return this.prisma.aITokenWallet.create({
      data: {
        userId,
        balance: 0,
        totalCharged: 0,
        totalUsed: 0,
        version: 1,
      },
    });
  }

  /**
   * Update wallet balance with optimistic locking (version check)
   * Increments version on success to prevent concurrent updates
   */
  async updateBalance(
    walletId: string,
    version: number,
    balanceChange: number,
    totalChargedChange: number = 0,
    totalUsedChange: number = 0,
  ) {
    return this.prisma.aITokenWallet.update({
      where: { id: walletId, version },
      data: {
        balance: { increment: balanceChange },
        totalCharged: { increment: totalChargedChange },
        totalUsed: { increment: totalUsedChange },
        version: { increment: 1 },
      },
    });
  }

  // ──────────────────────────────────────────────
  // AITokenTransaction
  // ──────────────────────────────────────────────

  /**
   * Create a token transaction record
   */
  async createTransaction(data: {
    walletId: string;
    userId: string;
    type: AITokenTransactionType;
    amount: number;
    balanceAfter: number;
    paymentId?: string;
    generationLogId?: string;
    description?: string;
  }) {
    return this.prisma.aITokenTransaction.create({ data });
  }

  /**
   * Find transactions for a user, optionally filtered by type.
   * Returns array sorted by createdAt DESC (newest first).
   * Supports cursor pagination via after parameter.
   */
  async findTransactionsByUserId(
    userId: string,
    type?: AITokenTransactionType,
    limit?: number,
    after?: string,
  ) {
    const take = limit ?? 20;
    const cursor = after ? decodeCursor(after) : undefined;

    const where: Prisma.AITokenTransactionWhereInput = {
      userId,
      ...(type && { type }),
    };

    return this.prisma.aITokenTransaction.findMany({
      where,
      take: take + 1, // fetch one extra to determine hasNextPage
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // AIGenerationLog
  // ──────────────────────────────────────────────

  /**
   * Create a generation log record
   */
  async createGenerationLog(data: {
    userId: string;
    novelId?: string;
    episodeId?: string;
    featureType: AIFeatureType;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    tokensCharged: number;
    inputText?: string;
    outputText?: string;
    charCount?: number;
    modelId?: string;
    request?: Prisma.InputJsonValue;
    response?: Prisma.InputJsonValue;
    wasAccepted?: boolean;
  }) {
    return this.prisma.aIGenerationLog.create({ data });
  }

  // ──────────────────────────────────────────────
  // NovelSetting (설정 노트)
  // ──────────────────────────────────────────────

  /**
   * Find settings by novelId, optionally filtered by category
   */
  async findSettingsByNovelId(novelId: string, category?: string) {
    const where: Prisma.NovelSettingWhereInput = {
      novelId,
      ...(category && { category }),
    };

    return this.prisma.novelSetting.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Find a single setting by id
   */
  async findSettingById(id: string) {
    return this.prisma.novelSetting.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new setting note
   */
  async createSetting(data: {
    novelId: string;
    category: string;
    title: string;
    content: string;
    isAIGenerated?: boolean;
    aiGenerationLogId?: string;
    sortOrder?: number;
  }) {
    return this.prisma.novelSetting.create({
      data: {
        ...data,
        isAIGenerated: data.isAIGenerated ?? false,
      },
    });
  }

  /**
   * Update an existing setting note
   */
  async updateSetting(
    id: string,
    data: {
      category?: string;
      title?: string;
      content?: string;
      sortOrder?: number;
    },
  ) {
    return this.prisma.novelSetting.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a setting note
   */
  async deleteSetting(id: string) {
    return this.prisma.novelSetting.delete({
      where: { id },
    });
  }

  // ──────────────────────────────────────────────
  // Pagination Helper
  // ──────────────────────────────────────────────

  /**
   * Convert array of records to cursor pagination format
   * Assumes records are pre-fetched with take + 1 to determine hasNextPage
   */
  static toPaginationResult<T extends { id: string }>(
    records: T[],
    take: number,
  ) {
    const hasNextPage = records.length > take;
    const items = hasNextPage ? records.slice(0, take) : records;

    return {
      edges: items.map((item) => ({
        node: item,
        cursor: encodeCursor(item.id),
      })),
      pageInfo: {
        hasNextPage,
        endCursor: items.length > 0 ? encodeCursor(items[items.length - 1].id) : null,
      },
      totalCount: items.length,
    };
  }
}
