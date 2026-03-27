import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const startTime = Date.now();
    const { method, path, ip } = req;

    const originalEnd = res.end.bind(res);

    res.end = function (...args: unknown[]) {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const metadata: Record<string, any> = {
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        ip,
      };

      if (req.query && Object.keys(req.query).length > 0) {
        metadata.query = req.query;
      }

      const message = `${method} ${path} - ${statusCode}`;
      const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log',
        message,
        context: 'HttpLogger',
        metadata,
      });

      if (statusCode >= 500) {
        console.error(logEntry);
      } else if (statusCode >= 400) {
        console.warn(logEntry);
      } else {
        console.log(logEntry);
      }

      return originalEnd(...args);
    };

    next();
  }
}
