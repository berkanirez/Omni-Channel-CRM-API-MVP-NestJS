import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContextService } from '../../common/logger/request-context.service';

type AuditRecordInput = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  companyId?: string;
  metadata?: Record<string, any>;
  req?: Request;
};

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async record(input: AuditRecordInput) {
    const requestId = this.ctx.getRequestId();

    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
        companyId: input.companyId ?? null,
        requestId: requestId ?? null,

        route: input.req?.originalUrl ?? null,
        method: input.req?.method ?? null,
        ip: input.req?.ip ?? null,
        userAgent: input.req?.headers['user-agent'] ?? null,

        metadata: input.metadata ?? undefined,
      },
    });
  }
}
