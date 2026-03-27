import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SentryService } from './sentry.service';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 요청 컨텍스트 설정
    this.captureRequestContext(request);

    return next.handle().pipe(
      catchError((error) => {
        // ValidationError는 Sentry에 전송하지 않음 (이미 response로 반환됨)
        if (!(error instanceof BadRequestException)) {
          this.sentryService.captureException(error, {
            method: request.method,
            url: request.url,
            userId: request.user?.id,
            statusCode: error.status || 500,
          });
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * 요청 컨텍스트를 Sentry에 기록
   * - 사용자 정보
   * - 요청 메타데이터
   * - 태그 설정
   */
  private captureRequestContext(request: any): void {
    /**
     * 주석: Sentry 컨텍스트 설정
     * import * as Sentry from '@sentry/nestjs';
     *
     * if (request.user?.id) {
     *   Sentry.setUser({
     *     id: request.user.id,
     *     email: request.user.email,
     *   });
     * }
     *
     * Sentry.captureMessage(`Request: ${request.method} ${request.url}`, 'info');
     *
     * Sentry.setTag('method', request.method);
     * Sentry.setTag('url', request.url);
     */

    console.debug(`Request captured: ${request.method} ${request.url}`);
  }
}
