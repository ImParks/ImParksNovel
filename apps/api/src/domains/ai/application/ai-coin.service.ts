import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CoinTransactionType } from '@prisma/client';

// ──────────────────────────────────────────────
// AI Coin Cost Mapping
// ──────────────────────────────────────────────

export enum AIFeatureCost {
  TEXT_IMPROVEMENT = 1,
  SETTING_GENERATION = 3,
  PLOT_SUGGESTION = 3,
  CONTINUE_WRITING = 5,
  EPISODE_SPLIT = 5,
  PREMIUM_CONTINUE = 10,
  DETAILED_ANALYSIS = 15,
}

export interface CoinDeductionResult {
  walletId: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  transactionId: string;
}

export interface BalanceCheckResult {
  sufficient: boolean;
  required: number;
  balance: number;
}

// ──────────────────────────────────────────────
// AI Coin Service
// ──────────────────────────────────────────────

@Injectable()
export class AiCoinService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 기능별 코인 비용 조회
   */
  getFeatureCost(featureType: string): number {
    const cost = AIFeatureCost[featureType as keyof typeof AIFeatureCost];
    if (cost === undefined) {
      throw new BadRequestException(`유효하지 않은 AI 기능입니다: ${featureType}`);
    }
    return cost;
  }

  /**
   * 코인 차감 전 잔액 확인
   * @returns { sufficient, required, balance }
   */
  async checkBalance(
    userId: string,
    featureType: string,
  ): Promise<BalanceCheckResult> {
    const required = this.getFeatureCost(featureType);

    // 지갑 조회 또는 생성
    let wallet = await this.prisma.coinWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.coinWallet.create({
        data: {
          userId,
          balance: 0,
          totalCharged: 0,
          totalUsed: 0,
          totalRefunded: 0,
          version: 1,
        },
      });
    }

    return {
      sufficient: wallet.balance >= required,
      required,
      balance: wallet.balance,
    };
  }

  /**
   * AI 기능 사용으로 코인 선차감 (사전 차감)
   *
   * 트랜잭션 내에서:
   * 1. CoinWallet 조회 (낙관적 잠금)
   * 2. 잔액 확인
   * 3. 잔액 차감
   * 4. CoinTransaction 기록 (AI_USAGE)
   *
   * @throws BadRequestException 코인 부족
   * @throws InternalServerErrorException 트랜잭션 실패
   */
  async deductCoinsForAI(
    userId: string,
    featureType: string,
  ): Promise<CoinDeductionResult> {
    const amount = this.getFeatureCost(featureType);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 지갑 조회 또는 생성 (낙관적 잠금)
        let wallet = await tx.coinWallet.findUnique({ where: { userId } });

        if (!wallet) {
          wallet = await tx.coinWallet.create({
            data: {
              userId,
              balance: 0,
              totalCharged: 0,
              totalUsed: 0,
              totalRefunded: 0,
              version: 1,
            },
          });
        }

        // 2. 잔액 확인
        if (wallet.balance < amount) {
          throw new BadRequestException(
            `코인이 부족합니다. 필요: ${amount}, 보유: ${wallet.balance}`,
          );
        }

        // 3. 지갑 업데이트 (낙관적 잠금)
        const updated = await tx.coinWallet.update({
          where: { id: wallet.id, version: wallet.version },
          data: {
            balance: { decrement: amount },
            totalUsed: { increment: amount },
            version: { increment: 1 },
          },
        });

        // 4. 거래 기록
        const transaction = await tx.coinTransaction.create({
          data: {
            walletId: updated.id,
            userId,
            type: CoinTransactionType.AI_USAGE,
            amount: -amount,
            balanceAfter: updated.balance,
            description: `AI 기능 사용: ${featureType}`,
          },
        });

        return {
          walletId: updated.id,
          userId,
          amount,
          balanceAfter: updated.balance,
          transactionId: transaction.id,
        };
      });

      return result;
    } catch (error) {
      // 낙관적 잠금 충돌 또는 기타 에러
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error instanceof Error &&
        error.message.includes('Unique constraint failed')
      ) {
        throw new InternalServerErrorException('낙관적 잠금 충돌. 다시 시도해주세요.');
      }

      throw error;
    }
  }

  /**
   * AI 기능 실패 시 코인 환불
   *
   * @param userId 사용자 ID
   * @param amount 환불 코인 양
   * @param reason 환불 사유
   * @throws BadRequestException 환불할 코인이 음수
   */
  async refundCoinsForAI(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    if (amount <= 0) {
      throw new BadRequestException('환불 금액은 0보다 커야 합니다.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. 지갑 조회
        const wallet = await tx.coinWallet.findUnique({ where: { userId } });

        if (!wallet) {
          throw new InternalServerErrorException(
            `사용자 ${userId}의 지갑을 찾을 수 없습니다.`,
          );
        }

        // 2. 지갑 업데이트 (환불)
        const updated = await tx.coinWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amount },
            totalRefunded: { increment: amount },
          },
        });

        // 3. 거래 기록
        await tx.coinTransaction.create({
          data: {
            walletId: updated.id,
            userId,
            type: CoinTransactionType.AI_REFUND,
            amount,
            balanceAfter: updated.balance,
            description: `AI 기능 환불: ${reason}`,
          },
        });
      });
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`환불 처리 중 오류가 발생했습니다: ${error}`);
    }
  }

  /**
   * 트랜잭션 ID로 코인 차감 거래 조회
   * (환불 시 원본 거래 추적용)
   */
  async findTransactionById(transactionId: string) {
    return this.prisma.coinTransaction.findUnique({
      where: { id: transactionId },
    });
  }
}
