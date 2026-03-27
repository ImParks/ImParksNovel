import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './presentation/ai.controller';
import { AiResolver } from './presentation/ai.resolver';
import { AiOrchestrator } from './coordination/ai.orchestrator';
import { AiService } from './application/ai.service';
import { AiCoinService } from './application/ai-coin.service';
import { EpisodePlanService } from './application/episode-plan.service';
import { AiRepository } from './infrastructure/ai.repository';
import { OpenAiProvider } from './infrastructure/adapters/openai/openai.provider';
import {
  AIProviderPort,
  AI_PROVIDER_PORT,
} from './domain/ports/ai-provider.port';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiResolver,
    AiOrchestrator,
    AiService,
    AiCoinService,
    EpisodePlanService,
    AiRepository,
    {
      provide: AI_PROVIDER_PORT,
      useClass: OpenAiProvider,
    },
  ],
  exports: [AiService, AiCoinService, EpisodePlanService, AI_PROVIDER_PORT],
})
export class AiModule {}
