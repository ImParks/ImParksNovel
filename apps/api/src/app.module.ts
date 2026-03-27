import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { SentryModule } from './common/sentry/sentry.module';
import { UserModule } from './domains/user/user.module';
import { NovelModule } from './domains/novel/novel.module';
import { AiModule } from './domains/ai/ai.module';
import { PaymentModule } from './domains/payment/payment.module';
import { ContentModule } from './domains/content/content.module';
import { DiscoveryModule } from './domains/discovery/discovery.module';
import { AdminModule } from './domains/admin/admin.module';
import { SystemModule } from './domains/system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }: { req: Express.Request }) => ({ req }),
    }),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    PrismaModule,
    AuthModule,
    LoggerModule,
    SentryModule,

    // Domain Modules
    UserModule,
    NovelModule,
    AiModule,
    PaymentModule,
    ContentModule,
    DiscoveryModule,
    AdminModule,
    SystemModule,
  ],
})
export class AppModule {}
