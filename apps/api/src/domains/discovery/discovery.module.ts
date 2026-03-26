import { Module } from '@nestjs/common';
import { DiscoveryResolver } from './presentation/discovery.resolver';
import { DiscoveryOrchestrator } from './coordination/discovery.orchestrator';
import { DiscoveryService } from './application/discovery.service';
import { DiscoveryRepository } from './infrastructure/discovery.repository';

@Module({
  providers: [DiscoveryResolver, DiscoveryOrchestrator, DiscoveryService, DiscoveryRepository],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
