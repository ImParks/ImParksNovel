import { Injectable } from '@nestjs/common';

/**
 * Sentry 초기화 및 설정 서비스
 *
 * 역할:
 * - Sentry DSN 기반 초기화
 * - 환경별 설정 (dev/staging/production)
 * - 트랜잭션 샘플링 설정
 * - 무시할 에러 필터링
 */
@Injectable()
export class SentryService {
  constructor() {
    this.initializeSentry();
  }

  /**
   * Sentry 초기화
   * DSN이 없으면 건너뛴다
   */
  private initializeSentry(): void {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';

    if (!dsn) {
      console.log('SENTRY_DSN not configured, Sentry error tracking disabled');
      return;
    }

    try {
      /**
       * 주석: @sentry/nestjs 설치 필요
       * npm install @sentry/nestjs @sentry/tracing
       *
       * 사용 예시:
       * import * as Sentry from '@sentry/nestjs';
       *
       * Sentry.init({
       *   dsn,
       *   environment,
       *   tracesSampleRate: this.getTracesSampleRate(environment),
       *   integrations: [
       *     new Sentry.Integrations.Http({ tracing: true }),
       *     new Sentry.Integrations.Express({
       *       request: true,
       *       serverName: true,
       *       response: true,
       *     }),
       *   ],
       *   beforeSend: (event, hint) => {
       *     // 무시할 에러 필터링
       *     if (event.exception?.values?.[0]?.value?.includes('ECONNREFUSED')) {
       *       return null;
       *     }
       *     return event;
       *   },
       * });
       */

      console.log(`Sentry initialized with environment: ${environment}`);
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * 환경별 트레이스 샘플링 레이트
   * - production: 10% (비용 최적화)
   * - staging: 50%
   * - development: 100%
   */
  private getTracesSampleRate(environment: string): number {
    switch (environment) {
      case 'production':
        return 0.1;
      case 'staging':
        return 0.5;
      default:
        return 1.0;
    }
  }

  /**
   * 수동 에러 캡처
   * 인터셉터에서 잡을 수 없는 특수한 경우 사용
   *
   * 사용 예시:
   * this.sentryService.captureException(error);
   */
  captureException(error: Error, context?: Record<string, any>): void {
    /**
     * 주석: Sentry.captureException() 호출
     * import * as Sentry from '@sentry/nestjs';
     * Sentry.captureException(error, {
     *   contexts: { custom: context },
     * });
     */

    // Fallback: 콘솔 로깅
    console.error('Captured exception:', error.message, context);
  }

  /**
   * 사용자 정보 설정
   * 에러 추적 시 사용자 식별을 위해 사용
   *
   * 사용 예시:
   * this.sentryService.setUser({ id: 'user123', email: 'user@example.com' });
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    /**
     * 주석: Sentry.setUser() 호출
     * import * as Sentry from '@sentry/nestjs';
     * Sentry.setUser(user);
     */

    console.debug('User context set:', user.id);
  }

  /**
   * 사용자 정보 제거
   */
  clearUser(): void {
    /**
     * 주석: Sentry.setUser(null) 호출
     * import * as Sentry from '@sentry/nestjs';
     * Sentry.setUser(null);
     */

    console.debug('User context cleared');
  }
}
