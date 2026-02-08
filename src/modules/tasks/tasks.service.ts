import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AuditService } from 'src/common/audit/audit.service';

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'canceled';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
    private readonly audit: AuditService,
  ) {}

  private requireCompanyId(): string {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Tenant çözülemedi.');
    return companyId;
  }

  private requireUserId(): string {
    const userId = this.ctx.getUserId();
    if (!userId) throw new BadRequestException('User çözülemedi.');
    return userId;
  }

  private async ensureAssigneeInCompany(companyId: string, userId: string) {
    const membership = await this.prisma.userCompany.findFirst({
      where: { userId, companyId, isActive: true },
      select: { id: true },
    });
    if (!membership)
      throw new BadRequestException('Assignee bu şirkette üye değil.');
  }

  private async ensureCustomerInCompany(companyId: string, customerId: string) {
    const exists = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!exists)
      throw new BadRequestException(
        'Customer bulunamadı (tenant dışı olabilir).',
      );
  }

  private async ensureDealInCompany(companyId: string, dealId: string) {
    const exists = await this.prisma.deal.findFirst({
      where: { id: dealId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!exists)
      throw new BadRequestException('Deal bulunamadı (tenant dışı olabilir).');
  }

  async create(dto: CreateTaskDto) {
    const companyId = this.requireCompanyId();
    const currentUserId = this.requireUserId();

    const assigneeId = dto.assigneeId ?? currentUserId;

    await this.ensureAssigneeInCompany(companyId, assigneeId);
    if (dto.customerId)
      await this.ensureCustomerInCompany(companyId, dto.customerId);
    if (dto.dealId) await this.ensureDealInCompany(companyId, dto.dealId);

    const created = await this.prisma.task.create({
      data: {
        companyId,
        assigneeId,
        customerId: dto.customerId ?? null,
        dealId: dto.dealId ?? null,

        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });

    await this.audit.log({
      action: 'task:create',
      entity: 'Task',
      entityId: created.id,
      metadata: { title: created.title, assigneeId: created.assigneeId },
    });

    return created;
  }

  async list(query: ListTasksQueryDto) {
    const companyId = this.requireCompanyId();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const q = query.q?.trim();

    const dueFilter: any = {};
    if (query.dueFrom) dueFilter.gte = new Date(query.dueFrom);
    if (query.dueTo) dueFilter.lte = new Date(query.dueTo);

    const where: any = {
      companyId,
      deletedAt: null,

      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.dealId ? { dealId: query.dealId } : {}),
      ...(Object.keys(dueFilter).length ? { dueDate: dueFilter } : {}),

      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { [query.sortBy ?? 'createdAt']: query.order ?? 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listMy(query: ListTasksQueryDto) {
    const userId = this.requireUserId();

    return this.list({ ...query, assigneeId: userId });
  }

  async getById(id: string) {
    const companyId = this.requireCompanyId();

    const task = await this.prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task bulunamadı.');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const companyId = this.requireCompanyId();

    const existing = await this.prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, title: true },
    });
    if (!existing) throw new NotFoundException('Task bulunamadı.');

    if (dto.assigneeId)
      await this.ensureAssigneeInCompany(companyId, dto.assigneeId);
    if (dto.customerId)
      await this.ensureCustomerInCompany(companyId, dto.customerId);
    if (dto.dealId) await this.ensureDealInCompany(companyId, dto.dealId);

    const data = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.dueDate !== undefined
        ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
        : {}),
      ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      ...(dto.customerId !== undefined ? { customerId: dto.customerId } : {}),
      ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
    };

    const updated = await this.prisma.task.update({
      where: { id: existing.id },
      data,
    });

    await this.audit.log({
      action: 'task:update',
      entity: 'Task',
      entityId: existing.id,
      metadata: { changedFields: Object.keys(data) },
    });

    return updated;
  }

  private assertTransition(from: TaskStatus, to: TaskStatus) {
    const allowed: Record<TaskStatus, TaskStatus[]> = {
      todo: ['in_progress', 'canceled'],
      in_progress: ['todo', 'done', 'canceled'],
      done: ['in_progress'],
      canceled: ['todo'],
    };

    if (from === to) return;

    const ok = allowed[from]?.includes(to);
    if (!ok) {
      throw new BadRequestException(`Geçersiz status geçişi: ${from} -> ${to}`);
    }
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto) {
    const companyId = this.requireCompanyId();

    const task = await this.prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, status: true, completedAt: true },
    });

    if (!task) throw new NotFoundException('Task bulunamadı.');

    const from = task.status as TaskStatus;
    const to = dto.status as TaskStatus;

    this.assertTransition(from, to);

    if (from === to) return task;

    const completedAt = to === 'done' ? new Date() : null;

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: to,
        completedAt,
      },
    });

    await this.audit.log({
      action: 'task:updateStatus',
      entity: 'Task',
      entityId: task.id,
      metadata: { from, to },
    });

    return updated;
  }

  async softDelete(id: string) {
    const companyId = this.requireCompanyId();

    const task = await this.prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, title: true },
    });
    if (!task) throw new NotFoundException('Task bulunamadı.');

    await this.prisma.task.update({
      where: { id: task.id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      action: 'task:delete',
      entity: 'Task',
      entityId: task.id,
    });

    return { deleted: true };
  }
}
