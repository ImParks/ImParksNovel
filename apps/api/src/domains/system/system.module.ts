import { Module } from '@nestjs/common';
import { SystemResolver } from './presentation/system.resolver';
import { SystemService } from './application/system.service';
import { SystemRepository } from './infrastructure/system.repository';

@Module({
  providers: [SystemResolver, SystemService, SystemRepository],
  exports: [SystemService],
})
export class SystemModule {}
