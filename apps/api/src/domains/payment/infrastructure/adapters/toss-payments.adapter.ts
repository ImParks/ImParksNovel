import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TossPaymentResponse,
  TossPaymentError,
  TossConfirmPaymentRequest,
  TossCancelPaymentRequest,
} from './toss-payments.types';

// ──────────────────────────────────────────────
// Toss Payments Adapter
// ──────────────────────────────────────────────

/**
 * 토스페이먼츠 결제 게이트웨이 어댑터
 *
 * Domain Port로부터의 의존성:
 * - PaymentPort에서 호출되며, Infrastructure Layer의 포트 어댑터 역할
 * - Toss Payments API와의 상호작용을 담당
 *
 * 트랜잭션 전략:
 * - 단일 결제 승인/취소는 Local Transaction
 * - 복합 결제(결제+코인지급)는 상위 Coordinator가 Saga Orchestration 처리
 */
@Injectable()
export class TossPaymentsAdapter {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.getOrThrow<string>('TOSS_SECRET_KEY');
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
    request: TossConfirmPaymentRequest,
  ): Promise<TossPaymentResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${request.paymentKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.getAuthHeader(),
          },
          body: JSON.stringify({
            orderId: request.orderId,
            amount: request.amount,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        this.handleError(data as TossPaymentError);
      }

      return data as TossPaymentResponse;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `토스페이먼츠 결제 승인 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
    request: TossCancelPaymentRequest,
  ): Promise<TossPaymentResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${request.paymentKey}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.getAuthHeader(),
          },
          body: JSON.stringify({
            cancelReason: request.cancelReason,
            ...(request.cancelAmount && { cancelAmount: request.cancelAmount }),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        this.handleError(data as TossPaymentError);
      }

      return data as TossPaymentResponse;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `토스페이먼츠 결제 취소 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ──────────────────────────────────────────────
  // Error Handling
  // ──────────────────────────────────────────────

  /**
   * 토스 응답 에러를 NestJS 예외로 변환
   */
  private handleError(error: TossPaymentError): void {
    const { code, message } = error;

    // 자주 발생하는 에러 코드별 처리
    const errorMap: Record<string, string> = {
      INVALID_PAYMENT_KEY: '유효하지 않은 결제키',
      PAYMENT_NOT_FOUND: '결제를 찾을 수 없음',
      PAYMENT_ALREADY_CANCELED: '이미 취소된 결제',
      AMOUNT_MISMATCH: '금액이 일치하지 않음',
      INVALID_ORDERD_ID: '주문 ID가 유효하지 않음',
      PAYMENT_FAILED: '결제 실패',
      PAYMENT_IN_PROGRESS: '결제 진행 중',
    };

    const friendlyMessage = errorMap[code] || message;

    throw new BadRequestException({
      code,
      message: friendlyMessage,
      details: message,
      validationErrors: error.validationErrors,
    });
  }

  // ──────────────────────────────────────────────
  // Authentication
  // ──────────────────────────────────────────────

  /**
   * Basic Auth 헤더 생성
   * Toss API는 secretKey: 형식의 Base64 인코딩 필요
   */
  private getAuthHeader(): string {
    const credentials = `${this.secretKey}:`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
  }
}
