import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';
import { AuditLogInput } from './audit.types';

type TxClient = Prisma.TransactionClient;

type DbClient = PrismaService | TxClient;

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async log(input: AuditLogInput, client: DbClient = this.prisma) {
    const store = this.ctx.get();

    try {
      await client.auditLog.create({
        data: {
          userId: store.userId ?? null,
          companyId: store.companyId ?? null,
          requestId: store.requestId ?? null,

          route: store.route ?? null,
          method: store.method ?? null,
          ip: store.ip ?? null,
          userAgent: store.userAgent ?? null,

          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,

          metadata: input.metadata ?? undefined,
        },
      });
    } catch (e) {}
  }
}
