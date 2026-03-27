import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional()
    private readonly loggerService?: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);

    // GraphQL context: throw GraphQLError so Apollo formats it correctly
    if ((gqlHost.getType() as string) === 'graphql') {
      throw this.toGraphQLError(exception);
    }

    // REST fallback (health checks, etc.)
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const { status, message, code, stack } = this.extractDetails(exception);

    this.loggerService?.logWithMetadata(
      `[${code}] ${message}`,
      'GlobalExceptionFilter',
      {
        type: 'REST',
        status,
        code,
        path: request.path,
        method: request.method,
        ip: request.ip,
      },
      'error',
    );

    response.status(status).json({ statusCode: status, error: code, message });
  }

  private toGraphQLError(exception: unknown): GraphQLError {
    const { status, message, code, stack } = this.extractDetails(exception);

    this.loggerService?.logWithMetadata(
      `[${code}] ${message}`,
      'GlobalExceptionFilter',
      {
        type: 'GraphQL',
        status,
        code,
      },
      'error',
    );

    return new GraphQLError(message, {
      extensions: {
        code,
        statusCode: status,
      },
    });
  }

  private extractDetails(exception: unknown): {
    status: number;
    message: string;
    code: string;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string | string[] }).message
            ? Array.isArray((response as { message: string[] }).message)
              ? (response as { message: string[] }).message.join(', ')
              : String((response as { message: string }).message)
            : exception.message;

      return {
        status: exception.getStatus(),
        message,
        code: this.httpStatusToCode(exception.getStatus()),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
      };
    }

    const _message =
      exception instanceof Error ? exception.message : 'Internal server error';
    this.loggerService?.error('Unexpected error', exception instanceof Error ? exception.stack : '');

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  private handlePrismaError(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (e.code) {
      case 'P2002': {
        const fields = (e.meta?.target as string[])?.join(', ') ?? 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `Duplicate value for ${fields}`,
          code: 'CONFLICT',
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          code: 'NOT_FOUND',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          code: 'BAD_REQUEST',
        };
      default:
        this.loggerService?.logWithMetadata(
          `Unhandled Prisma error ${e.code}`,
          'GlobalExceptionFilter',
          { prismaCode: e.code, message: e.message },
          'error',
        );
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          code: 'DATABASE_ERROR',
        };
    }
  }

  private httpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'ERROR';
  }
}
