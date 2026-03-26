import { Module } from '@nestjs/common';
import { AuthModule } from '../../common/auth/auth.module';
import { UserResolver } from './presentation/user.resolver';
import { UserController } from './presentation/user.controller';
import { UserOrchestrator } from './coordination/user.orchestrator';
import { UserService } from './application/user.service';
import { UserRepository } from './infrastructure/user.repository';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserResolver, UserOrchestrator, UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
