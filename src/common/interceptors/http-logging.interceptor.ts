import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const start = Date.now();

    this.logger.log('HTTP request started', {
      method: req.method,
      path: req.originalUrl,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;

          this.logger.log('HTTP request completed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: ms,
          });
        },
        error: (err) => {
          const ms = Date.now() - start;

          this.logger.error('HTTP request failed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: ms,
            errorName: err?.name,
            errorMessage: err?.message,
          });
        },
      }),
    );
  }
}
