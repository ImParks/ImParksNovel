import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogMetadata {
  [key: string]: unknown;
}

export interface StructuredLog {
  timestamp: string;
  level: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
  message: string;
  context?: string;
  metadata?: LogMetadata;
  stack?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createStructuredLog(
    level: StructuredLog['level'],
    message: string,
    context?: string,
    metadata?: LogMetadata,
    stack?: string,
  ): StructuredLog {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...(context && { context }),
      ...(metadata && { metadata }),
      ...(stack && { stack }),
    };
  }

  private formatOutput(log: StructuredLog): string {
    if (this.isProduction) {
      return JSON.stringify(log);
    }

    // Development: 컬러 출력 + JSON 구조 표시
    const colorMap = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      log: '\x1b[36m', // Cyan
      debug: '\x1b[35m', // Magenta
      verbose: '\x1b[37m', // White
    };

    const resetColor = '\x1b[0m';
    const color = colorMap[log.level] || resetColor;

    const parts = [
      `${color}[${log.level.toUpperCase()}]${resetColor}`,
      `[${log.timestamp}]`,
    ];

    if (log.context) {
      parts.push(`[${log.context}]`);
    }

    parts.push(log.message);

    let output = parts.join(' ');

    if (log.metadata && Object.keys(log.metadata).length > 0) {
      output += '\n' + JSON.stringify(log.metadata, null, 2);
    }

    if (log.stack) {
      output += '\n' + log.stack;
    }

    return output;
  }

  error(message: string, stack?: string, context?: string): void {
    const log = this.createStructuredLog('error', message, context, undefined, stack);
    console.error(this.formatOutput(log));
  }

  warn(message: string, context?: string, metadata?: LogMetadata): void {
    const log = this.createStructuredLog('warn', message, context, metadata);
    console.warn(this.formatOutput(log));
  }

  log(message: string, context?: string, metadata?: LogMetadata): void {
    const log = this.createStructuredLog('log', message, context, metadata);
    console.log(this.formatOutput(log));
  }

  debug(message: string, context?: string, metadata?: LogMetadata): void {
    if (!this.isDevelopment) return;
    const log = this.createStructuredLog('debug', message, context, metadata);
    console.debug(this.formatOutput(log));
  }

  verbose(message: string, context?: string, metadata?: LogMetadata): void {
    if (!this.isDevelopment) return;
    const log = this.createStructuredLog('verbose', message, context, metadata);
    console.log(this.formatOutput(log));
  }

  /**
   * Structured logging: 메타데이터와 함께 로그 기록
   * @example this.logger.logWithMetadata('User logged in', 'AuthService', { userId: '123', ipAddress: '127.0.0.1' })
   */
  logWithMetadata(
    message: string,
    context: string,
    metadata: LogMetadata,
    level: StructuredLog['level'] = 'log',
  ): void {
    const log = this.createStructuredLog(level, message, context, metadata);
    const output = this.formatOutput(log);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (this.isDevelopment) console.debug(output);
        break;
      case 'verbose':
        if (this.isDevelopment) console.log(output);
        break;
      case 'log':
      default:
        console.log(output);
    }
  }

  /**
   * 성능 측정: 작업 실행 시간을 로깅
   * @example
   * await this.logger.measure('Database query', 'PaymentService', async () => {
   *   return db.query(...)
   * })
   */
  async measure<T>(
    operationName: string,
    context: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.logWithMetadata(
        `${operationName} completed`,
        context,
        { duration: `${duration}ms` },
        'log',
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logWithMetadata(
        `${operationName} failed`,
        context,
        {
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : String(error),
        },
        'error',
      );
      throw error;
    }
  }
}
