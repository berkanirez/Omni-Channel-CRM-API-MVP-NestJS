import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersRegistry } from './providers/registry';
import { RequestContextService } from '../common/logger/request-context.service';
import { SendDto } from './dto/send.dto';
import { CommunicationChannel } from './dto/send.dto';
import { calcNextRetryAt } from './constants/communication.constants';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ProvidersRegistry,
    private readonly ctx: RequestContextService,
  ) {}

  async sendManual(
    dto: SendDto,
    meta?: {
      companyId: string;
      userId?: string | null;
      requestId?: string | null;
    },
  ) {
    const store = this.ctx.get();
    const companyId = meta?.companyId ?? store.companyId;
    if (!companyId) throw new BadRequestException('companyId missing');
    const createdById = meta?.userId ?? store.userId ?? null;
    const requestId = meta?.requestId ?? store.requestId ?? null;

    this.assertToMatchesChannel(dto.channel, dto.to);

    await this.assertRelationsAreInCompany(companyId, dto);

    const payloadSnapshot = {
      to: dto.to,
      subject: dto.subject ?? null,
      body: dto.body ?? null,
      templateKey: dto.templateKey ?? null,
      variables: dto.variables ?? null,
    };

    const record = await this.prisma.communicationRecord.create({
      data: {
        companyId,
        channel: dto.channel as any,
        status: 'queued' as any,
        provider: 'pending',
        payloadSnapshot,
        requestId,
        createdById,
        customerId: dto.customerId ?? null,
        contactId: dto.contactId ?? null,
        dealId: dto.dealId ?? null,
        taskId: dto.taskId ?? null,
      },
    });

    try {
      const provider = this.registry.get(dto.channel);
      const result = await provider.send({
        to: dto.to,
        subject: dto.subject,
        body: dto.body,
        templateKey: dto.templateKey,
        variables: dto.variables,
      });

      return await this.prisma.communicationRecord.update({
        where: { id: record.id },
        data: {
          provider: result.provider,
          providerMessageId: result.providerMessageId ?? null,
          providerResponse: result.raw ?? undefined,
          status: 'sent' as any,
          sentAt: new Date(),
        },
      });
    } catch (e: any) {
      await this.prisma.communicationRecord.update({
        where: { id: record.id },
        data: {
          status: 'failed' as any,
          failedAt: new Date(),
          errorMessage: String(e?.message ?? e).slice(0, 500),
        },
      });

      throw e;
    }
  }

  async attemptSend(recordId: string) {
    const store = this.ctx.get();

    const record = await this.prisma.communicationRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) throw new Error('Record not found');

    if (!['queued', 'failed'].includes(record.status)) {
      return record;
    }

    await this.prisma.communicationRecord.update({
      where: { id: record.id },
      data: { lastAttemptAt: new Date() },
    });

    try {
      const provider = this.registry.get(record.channel as any);

      const snap = record.payloadSnapshot as any;

      const result = await provider.send({
        to: snap.to,
        subject: snap.subject ?? undefined,
        body: snap.body ?? undefined,
        templateKey: snap.templateKey ?? undefined,
        variables: snap.variables ?? undefined,
      });

      return await this.prisma.communicationRecord.update({
        where: { id: record.id },
        data: {
          provider: result.provider,
          providerMessageId: result.providerMessageId ?? null,
          providerResponse: result.raw ?? undefined,
          status: 'sent' as any,
          sentAt: new Date(),
          failedAt: null,
          errorMessage: null,
          nextRetryAt: null,
        },
      });
    } catch (e: any) {
      const nextRetryAt = calcNextRetryAt(record.retryCount);

      return await this.prisma.communicationRecord.update({
        where: { id: record.id },
        data: {
          status: 'failed' as any,
          failedAt: new Date(),
          errorMessage: String(e?.message ?? e).slice(0, 500),
          retryCount: record.retryCount + 1,
          nextRetryAt,
        },
      });
    }
  }

  private assertToMatchesChannel(channel: CommunicationChannel, to: string) {
    if (channel === CommunicationChannel.sms) {
      if (to.includes('@'))
        throw new BadRequestException('SMS için to telefon olmalı.');
    }
    if (channel === CommunicationChannel.email) {
      if (!to.includes('@'))
        throw new BadRequestException('Email için to email olmalı.');
    }
  }

  private async assertRelationsAreInCompany(companyId: string, dto: SendDto) {
    if (dto.customerId) {
      const ok = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, companyId },
        select: { id: true },
      });
      if (!ok)
        throw new BadRequestException('customerId bu company içinde değil.');
    }
  }

  async list() {
    const store = this.ctx.get();
    return this.prisma.communicationRecord.findMany({
      where: { companyId: store.companyId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    const store = this.ctx.get();
    return this.prisma.communicationRecord.findFirst({
      where: { id, companyId: store.companyId! },
    });
  }
}
