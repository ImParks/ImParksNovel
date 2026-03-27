import { Module, Global } from '@nestjs/common';
import { SentryService } from './sentry.service';

/**
 * Sentry 글로벌 모듈
 * 에러 추적 및 성능 모니터링
 *
 * 설치 필요:
 * npm install @sentry/nestjs @sentry/tracing
 *
 * 주의: SENTRY_DSN 환경변수가 없으면 초기화를 건너뛴다
 */
@Global()
@Module({
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
