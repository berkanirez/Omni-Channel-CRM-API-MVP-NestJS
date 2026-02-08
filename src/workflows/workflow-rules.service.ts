import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/logger/request-context.service';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';

@Injectable()
export class WorkflowRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async create(dto: CreateWorkflowRuleDto) {
    const store = this.ctx.get();

    return this.prisma.workflowRule.create({
      data: {
        companyId: store.companyId!,
        name: dto.name,
        eventKey: dto.eventKey as any,
        enabled: dto.enabled ?? true,
        conditions: dto.conditions ?? undefined,
        action: dto.action,
        createdById: store.userId ?? null,
      },
    });
  }

  async list(eventKey?: string) {
    const store = this.ctx.get();
    return this.prisma.workflowRule.findMany({
      where: {
        companyId: store.companyId!,
        deletedAt: null,
        ...(eventKey ? { eventKey: eventKey as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    const store = this.ctx.get();
    const rule = await this.prisma.workflowRule.findFirst({
      where: { id, companyId: store.companyId!, deletedAt: null },
    });
    if (!rule) throw new NotFoundException('WorkflowRule not found');
    return rule;
  }

  async update(id: string, dto: UpdateWorkflowRuleDto) {
    await this.getById(id);

    return this.prisma.workflowRule.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        enabled: dto.enabled ?? undefined,
        eventKey: (dto.eventKey as any) ?? undefined,
        conditions: dto.conditions ?? undefined,
        action: dto.action ?? undefined,
      },
    });
  }

  async remove(id: string) {
    await this.getById(id);

    return this.prisma.workflowRule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
