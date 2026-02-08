import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppLogger } from './app-logger.service';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    this.logger.log('HTTP request started', {
      method: req.method,
      path: req.originalUrl,
    });

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const statusCode = res.statusCode;

      if (statusCode >= 400) {
        this.logger.warn('HTTP request failed', {
          method: req.method,
          path: req.originalUrl,
          statusCode,
          durationMs,
        });
      } else {
        this.logger.log('HTTP request completed', {
          method: req.method,
          path: req.originalUrl,
          statusCode,
          durationMs,
        });
      }
    });

    next();
  }
}
