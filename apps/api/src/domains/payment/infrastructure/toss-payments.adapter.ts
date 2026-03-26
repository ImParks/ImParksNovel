import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/**
 * 토스페이먼츠 결제 승인 응답
 * https://docs.tosspayments.com/reference#결제-승인
 */
export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  mid: string;
  currency: string;
  method: 'CARD' | 'TRANSFER' | 'PHONE' | 'VIRTUAL_ACCOUNT';
  totalAmount: number;
  balanceAmount: number;
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'COMPLETED' | 'ABORTED' | 'CANCELED';
  requestedAt: string;
  approvedAt?: string;
  useEscrow: boolean;
  cultureExpense: boolean;

  // 결제 수단별 상세 (선택 필드)
  card?: Record<string, any>;
  virtualAccount?: Record<string, any>;
  transfer?: Record<string, any>;
  mobilePhone?: Record<string, any>;
  easyPay?: Record<string, any>;

  // 환불 및 기타
  cancels?: Array<Record<string, any>>;
  secret?: string;
  version: string;
  type: 'NORMAL' | 'BILLING' | 'KEY_IN';
}

/**
 * 토스페이먼츠 에러 응답
 */
export interface TossPaymentError {
  code: string;
  message: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

/**
 * 토스페이먼츠 결제 확인 요청
 */
export interface TossConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * 토스페이먼츠 결제 취소 요청
 */
export interface TossCancelPaymentRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}

/**
 * 결제 결과 응답
 */
export interface PaymentResult {
  success: boolean;
  error?: string;
  data?: {
    paymentKey: string;
    orderId: string;
    status: string;
    amount: number;
  };
}

// ──────────────────────────────────────────────
// Toss Payments Adapter
// ──────────────────────────────────────────────

/**
 * 토스페이먼츠 결제 게이트웨이 어댑터
 *
 * Domain Port로부터의 의존성:
 * - Infrastructure Layer의 포트 어댑터 역할
 * - Toss Payments API와의 상호작용을 담당
 *
 * 트랜잭션 전략:
 * - 단일 결제 승인/취소는 Local Transaction
 * - 복합 결제(결제+코인지급)는 상위 Coordinator가 Saga Orchestration 처리
 */
@Injectable()
export class TossPaymentsAdapter {
  private readonly baseUrl = 'https://api.tosspayments.com/v1';
  private readonly secretKey: string;

  constructor(
    private readonly config: ConfigService,
  ) {
    this.secretKey = this.config.getOrThrow('TOSS_SECRET_KEY');
  }

  // ──────────────────────────────────────────────
  // Payment Confirmation
  // ──────────────────────────────────────────────

  /**
   * 결제 승인
   * - 클라이언트의 paymentKey + orderId + amount로 서버에서 검증 후 승인
   * - Idempotent: 같은 요청 재시도 시 안전
   */
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<PaymentResult> {
    try {
      const authHeader = this.getAuthHeader();

      const response = await fetch(
        `${this.baseUrl}/payments/${paymentKey}`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, amount }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json() as TossPaymentError;
        return {
          success: false,
          error: errorData.message || '결제 승인에 실패했습니다.',
        };
      }

      const data = await response.json() as TossPaymentResponse;

      return {
        success: true,
        data: {
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          status: data.status,
          amount: data.totalAmount,
        },
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ──────────────────────────────────────────────
  // Payment Cancellation
  // ──────────────────────────────────────────────

  /**
   * 결제 취소
   * - 완료된 결제를 취소하고 환불 처리
   * - cancelAmount가 없으면 전액 취소
   */
  async cancelPayment(
    paymentKey: string,
    reason: string,
    cancelAmount?: number,
  ): Promise<PaymentResult> {
    try {
      const authHeader = this.getAuthHeader();

      const body: any = {
        cancelReason: reason,
      };
      if (cancelAmount) {
        body.cancelAmount = cancelAmount;
      }

      const response = await fetch(
        `${this.baseUrl}/payments/${paymentKey}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorData = await response.json() as TossPaymentError;
        return {
          success: false,
          error: errorData.message || '결제 취소에 실패했습니다.',
        };
      }

      const data = await response.json() as TossPaymentResponse;

      return {
        success: true,
        data: {
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          status: data.status,
          amount: data.totalAmount,
        },
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /**
   * Basic Auth 헤더 생성
   * Toss API는 secretKey: 형식의 Base64 인코딩 필요
   */
  private getAuthHeader(): string {
    const encodedKey = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${encodedKey}`;
  }

  /**
   * 토스 응답 에러를 사용자 친화적 메시지로 변환
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return '결제 처리 중 오류가 발생했습니다.';
  }
}
