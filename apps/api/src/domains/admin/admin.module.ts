import { Module } from '@nestjs/common';
import { AdminResolver } from './presentation/admin.resolver';
import { AdminService } from './application/admin.service';
import { AdminRepository } from './infrastructure/admin.repository';

@Module({
  providers: [AdminResolver, AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
