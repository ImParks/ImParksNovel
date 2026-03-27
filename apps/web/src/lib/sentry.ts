/**
 * Sentry 초기화 및 설정
 *
 * 설치 필요:
 * npm install @sentry/nextjs
 *
 * 사용처:
 * - instrumentation.ts (Next.js 부트스트랩)
 * - global-error.tsx (서버 에러 바운더리)
 * - error.tsx (클라이언트 에러 바운더리)
 */

/**
 * Sentry 클라이언트 초기화
 *
 * 사용 예시:
 * import * as Sentry from '@sentry/nextjs';
 *
 * export function initializeSentryClient() {
 *   const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
 *
 *   if (!dsn) {
 *     console.log('SENTRY_DSN not configured, Sentry error tracking disabled');
 *     return;
 *   }
 *
 *   Sentry.init({
 *     dsn,
 *     environment: process.env.NODE_ENV,
 *     tracesSampleRate: getTracesSampleRate(),
 *     integrations: [
 *       Sentry.replayIntegration({
 *         maskAllText: false,
 *         blockAllMedia: false,
 *       }),
 *     ],
 *     replaysSessionSampleRate: 0.1,
 *     replaysOnErrorSampleRate: 1.0,
 *   });
 * }
 */
export function initializeSentryClient() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.log('NEXT_PUBLIC_SENTRY_DSN not configured, Sentry disabled');
  }

  // 주석: @sentry/nextjs 설치 후 구현
  // npm install @sentry/nextjs
}

/**
 * 환경별 트레이스 샘플링 레이트
 * - production: 10%
 * - staging: 50%
 * - development: 100%
 */
export function getTracesSampleRate(): number {
  const env = process.env.NODE_ENV as string;

  switch (env) {
    case 'production':
      return 0.1;
    case 'staging':
      return 0.5;
    default:
      return 1.0;
  }
}

/**
 * 에러 캡처 (수동)
 * 에러 바운더리에서 잡을 수 없는 경우 사용
 *
 * 사용 예시:
 * import * as Sentry from '@sentry/nextjs';
 *
 * try {
 *   // 비동기 작업
 * } catch (error) {
 *   captureException(error);
 * }
 */
export function captureException(error: Error, context?: Record<string, any>) {
  /**
   * 주석: Sentry.captureException() 호출
   * import * as Sentry from '@sentry/nextjs';
   *
   * Sentry.captureException(error, {
   *   contexts: { custom: context },
   * });
   */

  console.error('Captured exception:', error.message, context);
}

/**
 * 사용자 정보 설정
 * 로그인 후 호출하여 에러 추적 시 사용자 식별
 *
 * 사용 예시:
 * import * as Sentry from '@sentry/nextjs';
 *
 * export function setUserContext(user: { id: string; email: string }) {
 *   Sentry.setUser({
 *     id: user.id,
 *     email: user.email,
 *   });
 * }
 */
export function setUserContext(user: { id: string; email: string }) {
  /**
   * 주석: Sentry.setUser() 호출
   * import * as Sentry from '@sentry/nextjs';
   * Sentry.setUser(user);
   */

  console.debug('User context set:', user.id);
}

/**
 * 사용자 정보 제거
 * 로그아웃 시 호출
 *
 * 사용 예시:
 * import * as Sentry from '@sentry/nextjs';
 *
 * export function clearUserContext() {
 *   Sentry.setUser(null);
 * }
 */
export function clearUserContext() {
  /**
   * 주석: Sentry.setUser(null) 호출
   * import * as Sentry from '@sentry/nextjs';
   * Sentry.setUser(null);
   */

  console.debug('User context cleared');
}
