import { Module } from '@nestjs/common';
import { NovelResolver } from './presentation/novel.resolver';
import { NovelController } from './presentation/novel.controller';
import { NovelOrchestrator } from './coordination/novel.orchestrator';
import { NovelService } from './application/novel.service';
import { NovelRepository } from './infrastructure/novel.repository';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PaymentModule],
  controllers: [NovelController],
  providers: [NovelResolver, NovelOrchestrator, NovelService, NovelRepository],
  exports: [NovelService],
})
export class NovelModule {}
