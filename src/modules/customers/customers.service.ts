import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers.dto';
import { AuditService } from 'src/common/audit/audit.service';
import { EventBus } from 'src/common/events/event-bus.service';
import { WorkflowEventKey } from 'src/workflows/dto/create-workflow-rule.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
    private readonly audit: AuditService,
    private readonly bus: EventBus,
  ) {}

  async create(dto: CreateCustomerDto) {
    const store = this.ctx.get();
    const companyId = this.ctx.getCompanyId();
    const userId = this.ctx.getUserId();

    if (!companyId) throw new BadRequestException('Company çözülemedi.');
    if (!userId) throw new BadRequestException('User çözülemedi.');

    if (dto.email) {
      const exists = await this.prisma.customer.findFirst({
        where: {
          companyId,
          email: dto.email,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (exists) {
        throw new BadRequestException('Bu email ile müşteri zaten var.');
      }
    }

    const created = await this.prisma.customer.create({
      data: {
        companyId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
      },
    });
    console.log('[BUS] publishing customer_created', {
      customerId: created.id,
      companyId,
    });

    await this.bus.publish(WorkflowEventKey.customer_created, {
      eventId: randomUUID(),
      occurredAt: new Date(),
      companyId: store.companyId!,
      actorUserId: store.userId ?? null,
      requestId: store.requestId ?? null,
      customerId: created.id,
    });

    await this.audit.log({
      action: 'customer:create',
      entity: 'Customer',
      entityId: created.id,
      metadata: { name: created.name, type: created.type ?? null },
    });

    return created;
  }

  async list(query: ListCustomersQueryDto) {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Company çözülemedi.');

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const q = query.q?.trim();
    const where = {
      companyId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy =
      query.sortBy === 'name'
        ? { name: query.order ?? 'desc' }
        : { createdAt: query.order ?? 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
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
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Company çözülemedi.');

    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!customer) throw new NotFoundException('Customer bulunamadı.');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Company çözülemedi.');

    const existing = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Customer bulunamadı.');

    if (dto.email) {
      const clash = await this.prisma.customer.findFirst({
        where: {
          companyId,
          email: dto.email,
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      });
      if (clash)
        throw new BadRequestException('Bu email başka bir müşteride var.');
    }

    const data = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
    };

    const updated = await this.prisma.customer.update({ where: { id }, data });

    await this.audit.log({
      action: 'customer:update',
      entity: 'Customer',
      entityId: id,
      metadata: { changedFields: Object.keys(data) },
    });

    return updated;
  }

  async softDelete(id: string) {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Company çözülemedi.');

    const existing = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Customer bulunamadı.');

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      action: 'customer:delete',
      entity: 'Customer',
      entityId: id,
    });

    return updated;
  }
}
