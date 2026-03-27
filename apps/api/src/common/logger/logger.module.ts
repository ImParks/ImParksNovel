import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { HttpLoggerMiddleware } from './http-logger.middleware';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
