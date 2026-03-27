import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { SentryInterceptor } from './common/sentry/sentry.interceptor';
import { SentryService } from './common/sentry/sentry.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable NestJS default logger to use our custom logger
    logger: false,
  });

  // Set custom logger as global logger
  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Register Sentry error tracking interceptor
  const sentryService = app.get(SentryService);
  app.useGlobalInterceptors(new SentryInterceptor(sentryService));

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  loggerService.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  loggerService.log(
    `GraphQL Playground: http://localhost:${port}/graphql`,
    'Bootstrap',
  );
}

bootstrap();

