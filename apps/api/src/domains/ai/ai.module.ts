import { Module } from '@nestjs/common';
import { AiController } from './presentation/ai.controller';
import { AiResolver } from './presentation/ai.resolver';
import { AiOrchestrator } from './coordination/ai.orchestrator';
import { AiService } from './application/ai.service';
import { AiRepository } from './infrastructure/ai.repository';

@Module({
  controllers: [AiController],
  providers: [AiResolver, AiOrchestrator, AiService, AiRepository],
  exports: [AiService],
})
export class AiModule {}
