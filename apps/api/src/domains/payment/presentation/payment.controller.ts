import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { PaymentStatus, Prisma } from '@prisma/client';

interface TossWebhookBody {
  eventType: string;
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    method?: string;
    totalAmount?: number;
    approvedAt?: string;
    cancels?: Array<{
      cancelAmount: number;
      cancelReason: string;
      canceledAt: string;
    }>;
  };
}

@Controller('api/webhooks')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly configService: ConfigService,
  ) {}

  @Post('toss-payments')
  @HttpCode(HttpStatus.OK)
  async handleTossWebhook(
    @Headers('toss-signature') signature: string,
    @Body() body: TossWebhookBody,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Toss webhook: ${body.eventType} orderId=${body.data.orderId}`);

    // 멱등성: 이미 처리된 결제인지 확인
    const payment = await this.paymentRepository.findPaymentByOrderId(body.data.orderId);
    if (!payment) {
      this.logger.warn(`Unknown orderId: ${body.data.orderId}`);
      return { success: true };
    }

    if (payment.status === PaymentStatus.COMPLETED && body.eventType === 'PAYMENT_STATUS_CHANGED') {
      this.logger.log(`Already processed: ${body.data.orderId}`);
      return { success: true };
    }

    // 결제 상태 변경 이벤트 처리
    if (body.eventType === 'PAYMENT_STATUS_CHANGED') {
      const status = body.data.status;

      if (status === 'DONE') {
        await this.paymentRepository.updatePayment(payment.id, {
          status: PaymentStatus.COMPLETED,
          pgPaymentKey: body.data.paymentKey,
          completedAt: new Date(),
          pgResponse: body.data as unknown as Prisma.InputJsonValue,
        });
      } else if (status === 'CANCELED') {
        const cancel = body.data.cancels?.[0];
        await this.paymentRepository.updatePayment(payment.id, {
          status: PaymentStatus.CANCELLED,
          refundedAmount: cancel?.cancelAmount,
          refundedAt: cancel ? new Date(cancel.canceledAt) : new Date(),
          refundReason: cancel?.cancelReason,
          pgResponse: body.data as unknown as Prisma.InputJsonValue,
        });
      } else if (status === 'ABORTED' || status === 'EXPIRED') {
        await this.paymentRepository.updatePayment(payment.id, {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failReason: `Payment ${status.toLowerCase()}`,
          pgResponse: body.data as unknown as Prisma.InputJsonValue,
        });
      }
    }

    return { success: true };
  }
}
