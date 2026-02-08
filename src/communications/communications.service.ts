import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersRegistry } from './providers/registry';
import { TestSendDto, CommunicationChannel } from './dto/test-send.dto';
import { RequestContextService } from '../common/logger/request-context.service';
import { validateRecipient } from './utils/recipient.util';

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersRegistry,
    private readonly ctx: RequestContextService,
  ) {}

  private async resolveTo(dto: TestSendDto, companyId: string) {
    let resolvedTo = dto.to;

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, companyId, deletedAt: null },
        select: { email: true, phone: true, id: true },
      });

      if (!customer) throw new NotFoundException('Customer not found');

      if (dto.channel === CommunicationChannel.email) {
        if (!customer.email)
          throw new BadRequestException('Customer has no email');
        resolvedTo = customer.email;
      }

      if (dto.channel === CommunicationChannel.sms) {
        if (!customer.phone)
          throw new BadRequestException('Customer has no phone');
        resolvedTo = customer.phone;
      }
    }

    validateRecipient(dto.channel, resolvedTo);

    return { resolvedTo };
  }

  async testSend(dto: TestSendDto) {
    const store = this.ctx.get();
    const companyId = store.companyId!;
    const createdById = store.userId ?? null;

    const { resolvedTo } = await this.resolveTo(dto, companyId);

    const payloadSnapshot = {
      clientTo: dto.to,
      to: resolvedTo,

      subject: dto.subject ?? null,
      templateKey: dto.templateKey ?? null,
      variables: dto.variables ?? null,
      body: dto.body ?? null,
    };

    const record = await this.prisma.communicationRecord.create({
      data: {
        companyId,
        channel: dto.channel as any,
        status: 'queued' as any,
        provider: 'pending',

        payloadSnapshot,

        requestId: store.requestId ?? null,
        createdById,

        customerId: dto.customerId ?? null,
        contactId: dto.contactId ?? null,
        dealId: dto.dealId ?? null,
        taskId: dto.taskId ?? null,
      },
    });

    try {
      const provider = this.providers.get(dto.channel);

      const result = await provider.send({
        to: resolvedTo,
        subject: dto.subject,
        body: dto.body,
        templateKey: dto.templateKey,
        variables: dto.variables,
      });

      const updated = await this.prisma.communicationRecord.update({
        where: { id: record.id },
        data: {
          provider: result.provider,
          providerMessageId: result.providerMessageId ?? null,
          providerResponse: result.raw ?? undefined,
          status: 'sent' as any,
          sentAt: new Date(),
        },
      });

      return updated;
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
