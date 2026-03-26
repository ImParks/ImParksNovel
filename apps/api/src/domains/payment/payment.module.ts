import { Module } from '@nestjs/common';
import { PaymentResolver } from './presentation/payment.resolver';
import { PaymentController } from './presentation/payment.controller';
import { PaymentOrchestrator } from './coordination/payment.orchestrator';
import { PaymentService } from './application/payment.service';
import { PaymentRepository } from './infrastructure/payment.repository';
import { TossPaymentsAdapter } from './infrastructure/toss-payments.adapter';

@Module({
  imports: [],
  controllers: [PaymentController],
  providers: [PaymentResolver, PaymentOrchestrator, PaymentService, PaymentRepository, TossPaymentsAdapter],
  exports: [PaymentService, TossPaymentsAdapter],
})
export class PaymentModule {}
