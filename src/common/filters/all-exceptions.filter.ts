import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import type { ApiError } from '../http/api-response';

function toErrorCode(status: number) {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.handlePrismaKnownError(exception);

      const body: ApiError = {
        success: false,
        error: {
          statusCode: mapped.status,
          code: mapped.code,
          message: mapped.message,
          details: { prismaCode: exception.code, meta: exception.meta },
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        },
      };

      return res.status(mapped.status).json(body);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      const normalized =
        typeof response === 'string'
          ? { message: response }
          : (response as any);

      const message =
        (Array.isArray(normalized?.message)
          ? normalized.message.join(' | ')
          : normalized?.message) ||
        exception.message ||
        'Request failed';

      const body: ApiError = {
        success: false,
        error: {
          statusCode: status,
          code: toErrorCode(status),
          message,
          details: normalized,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        },
      };

      return res.status(status).json(body);
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiError = {
      success: false,
      error: {
        statusCode: status,
        code: toErrorCode(status),
        message: 'Unexpected server error',
        details:
          exception instanceof Error
            ? { name: exception.name, message: exception.message }
            : exception,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      },
    };

    return res.status(status).json(body);
  }

  private handlePrismaKnownError(e: Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      return {
        status: 409,
        code: 'UNIQUE_CONSTRAINT',
        message: 'Unique constraint violation',
      };
    }
    if (e.code === 'P2025') {
      return { status: 404, code: 'NOT_FOUND', message: 'Record not found' };
    }
    return {
      status: 400,
      code: 'PRISMA_ERROR',
      message: 'Database request failed',
    };
  }
}
