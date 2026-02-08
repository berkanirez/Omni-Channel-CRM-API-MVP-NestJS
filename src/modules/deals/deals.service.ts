import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DealStage } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';
// import { EventBusService } from 'src/common/events/event-bus.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { ListDealsQueryDto } from './dto/list-deals.dto';
import { AuditService } from 'src/common/audit/audit.service';
import { EventBus } from 'src/common/events/event-bus.service';
import { WorkflowEventKey } from 'src/workflows/dto/create-workflow-rule.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
    // private readonly eventBus: EventBusService,
    private readonly audit: AuditService,
    private readonly bus: EventBus,
  ) {}

  private getCompanyIdOrThrow() {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Tenant çözülemedi.');
    return companyId;
  }

  private getUserIdOrThrow() {
    const userId = this.ctx.getUserId();
    if (!userId) throw new BadRequestException('User çözülemedi.');
    return userId;
  }

  private async ensureCustomer(customerId: string, companyId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, deletedAt: null },
      select: { id: true, companyId: true },
    });

    if (!customer) throw new NotFoundException('Customer bulunamadı.');
    return customer;
  }

  private async ensureDeal(dealId: string, companyId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, companyId, deletedAt: null },
    });

    if (!deal) throw new NotFoundException('Deal bulunamadı.');
    return deal;
  }

  async create(dto: CreateDealDto) {
    const companyId = this.getCompanyIdOrThrow();
    const userId = this.getUserIdOrThrow();

    const customer = await this.ensureCustomer(dto.customerId, companyId);

    const created = await this.prisma.deal.create({
      data: {
        companyId,
        customerId: customer.id,
        ownerId: userId,
        title: dto.title,
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      },
    });

    await this.audit.log({
      action: 'deal:create',
      entity: 'Deal',
      entityId: created.id,
      metadata: {
        customerId: created.customerId,
        title: created.title,
        value: created.value ?? null,
        currency: created.currency ?? null,
      },
    });

    return created;
  }

  async list(query: ListDealsQueryDto) {
    const companyId = this.getCompanyIdOrThrow();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const q = query.q?.trim();
    const stage = query.stage;

    const where: any = {
      companyId,
      deletedAt: null,
      ...(stage ? { stage } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { customer: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true } },
          owner: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const companyId = this.getCompanyIdOrThrow();

    const deal = await this.prisma.deal.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!deal) throw new NotFoundException('Deal bulunamadı.');
    return deal;
  }

  async update(id: string, dto: UpdateDealDto) {
    const companyId = this.getCompanyIdOrThrow();

    await this.ensureDeal(id, companyId);

    if (dto.customerId !== undefined) {
      await this.ensureCustomer(dto.customerId, companyId);
    }

    const data = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.value !== undefined ? { value: dto.value } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.customerId !== undefined ? { customerId: dto.customerId } : {}),
    };

    const updated = await this.prisma.deal.update({ where: { id }, data });

    await this.audit.log({
      action: 'deal:update',
      entity: 'Deal',
      entityId: id,
      metadata: {
        changedFields: Object.keys(data),
      },
    });

    return updated;
  }

  async updateStage(id: string, newStage: DealStage) {
    const store = this.ctx.get();
    const companyId = this.getCompanyIdOrThrow();
    const userId = this.getUserIdOrThrow();

    const existing = await this.ensureDeal(id, companyId);

    if (existing.stage === newStage) {
      return existing;
    }

    const updated = await this.prisma.deal.update({
      where: { id: existing.id },
      data: { stage: newStage },
    });

    await this.bus.publish(WorkflowEventKey.deal_stage_changed, {
      eventId: randomUUID(),
      occurredAt: new Date(),
      companyId: store.companyId!,
      actorUserId: store.userId ?? null,
      requestId: store.requestId ?? null,
      dealId: updated.id,
      customerId: existing.customerId ?? null,
      fromStage: existing.stage,
      toStage: newStage,
    });

    await this.audit.log({
      action: 'deal:stage_update',
      entity: 'Deal',
      entityId: updated.id,
      metadata: {
        from: existing.stage,
        to: updated.stage,
        changedByUserId: userId,
      },
    });

    // await this.eventBus.publish({
    //   type: 'DealStageChanged',
    //   payload: {
    //     dealId: updated.id,
    //     companyId: updated.companyId,
    //     customerId: updated.customerId,
    //     oldStage: existing.stage,
    //     newStage: updated.stage,
    //     changedByUserId: userId,
    //     occurredAt: new Date().toISOString(),
    //   },
    // });

    return updated;
  }

  async softDelete(id: string) {
    const companyId = this.getCompanyIdOrThrow();

    await this.ensureDeal(id, companyId);

    await this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      action: 'deal:delete',
      entity: 'Deal',
      entityId: id,
    });

    return { deleted: true };
  }
}
