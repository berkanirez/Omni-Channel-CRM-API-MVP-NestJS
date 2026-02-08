import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/events/event-bus.service';
import { WorkflowEventKey } from '@prisma/client';
import {
  CustomerCreatedEvent,
  DealStageChangedEvent,
  TaskOverdueEvent,
} from '../common/events/domain-events';
import { MessageService } from '../communications/message.service';
import { CommunicationChannel } from '../communications/dto/test-send.dto';
import { ConditionEvaluatorService } from './evaluator/condition-evaluator.service';

@Injectable()
export class WorkflowEngineService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly message: MessageService,
    private readonly evaluator: ConditionEvaluatorService,
  ) {}

  onModuleInit() {
    this.bus.subscribe(WorkflowEventKey.customer_created, async (e) => {
      console.log('[WF] got customer_created', e.customerId);
      await this.handleCustomerCreated(e);
    });

    this.bus.subscribe(WorkflowEventKey.deal_stage_changed, (e) =>
      this.handleDealStageChanged(e),
    );

    this.bus.subscribe(WorkflowEventKey.task_overdue, (e) =>
      this.handleTaskOverdue(e),
    );
  }

  private async handleCustomerCreated(event: CustomerCreatedEvent) {
    await this.runRules(WorkflowEventKey.customer_created, event);
  }

  private async handleDealStageChanged(event: DealStageChangedEvent) {
    await this.runRules(WorkflowEventKey.deal_stage_changed, event);
  }

  private async handleTaskOverdue(event: TaskOverdueEvent) {
    await this.runRules(WorkflowEventKey.task_overdue, event);
  }

  private async runRules(eventKey: WorkflowEventKey, event: any) {
    const rules = await this.prisma.workflowRule.findMany({
      where: {
        companyId: event.companyId,
        eventKey,
        enabled: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('[WF] rules found', rules.length, {
      eventKey,
      companyId: event.companyId,
    });

    for (const rule of rules) {
      console.log('[WF] checking rule', rule.id, {
        conditions: rule.conditions,
      });

      const ok = this.evaluator.matches(rule.conditions as any, event);
      console.log('[WF] evaluator result', ok);

      if (!ok) continue;

      console.log('[WF] executing action', rule.id, rule.action);
      await this.executeAction(rule.action as any, event);
    }
  }

  private async executeAction(action: any, event: any) {
    if (action?.type !== 'sendMessage') return;

    const channel = action.channel as CommunicationChannel;

    const to = await this.resolveTo(action.to, channel, event);

    await this.message.sendManual(
      {
        channel,
        to,
        templateKey: action.templateKey,
        body: action.body,
        variables: action.variables ?? {},
        customerId: event.customerId ?? null,
        dealId: event.dealId ?? null,
        taskId: event.taskId ?? null,
      },
      {
        companyId: event.companyId,
        userId: event.actorUserId ?? null,
        requestId: event.requestId ?? null,
      },
    );
  }

  private async resolveTo(
    toField: any,
    channel: CommunicationChannel,
    event: any,
  ) {
    if (typeof toField === 'string') return toField;

    const source = toField?.source as string | undefined;
    if (!source) throw new Error('Workflow action.to missing');

    if (source.startsWith('customer.')) {
      const customerId = event.customerId;
      if (!customerId)
        throw new Error('Action wants customer.* but event has no customerId');

      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, companyId: event.companyId, deletedAt: null },
        select: { email: true, phone: true, name: true },
      });
      if (!customer) throw new Error('Customer not found for rule resolveTo');

      if (source === 'customer.email') {
        if (!customer.email) throw new Error('Customer email missing');
        return customer.email;
      }

      if (source === 'customer.phone') {
        if (!customer.phone) throw new Error('Customer phone missing');
        return customer.phone;
      }
    }

    throw new Error(`Unsupported to.source=${source}`);
  }
}
