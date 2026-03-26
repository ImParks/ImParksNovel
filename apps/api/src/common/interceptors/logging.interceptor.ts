import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();

    const contextType = context.getType() as string;

    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      const operation = `${info.parentType.name}.${info.fieldName}`;

      return next.handle().pipe(
        tap(() => {
          this.logger.log(`[GQL] ${operation} - ${Date.now() - start}ms`);
        }),
      );
    }

    // REST
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[HTTP] ${method} ${url} - ${Date.now() - start}ms`);
      }),
    );
  }
}
