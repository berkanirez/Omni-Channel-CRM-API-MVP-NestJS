import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly ctx: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomUUID();

    req.requestId = requestId;

    res.setHeader('x-request-id', requestId);

    this.ctx.run({ requestId }, () => {
      next();
    });
  }
}
