import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestMetaMiddleware implements NestMiddleware {
  constructor(private readonly ctx: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'];
    const ua =
      typeof userAgent === 'string'
        ? userAgent
        : Array.isArray(userAgent)
          ? userAgent[0]
          : undefined;

    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || req.ip;

    this.ctx.set({
      route: req.originalUrl,
      method: req.method,
      ip,
      userAgent: ua,
    });

    next();
  }
}
