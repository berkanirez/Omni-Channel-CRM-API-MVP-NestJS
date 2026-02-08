import { WorkflowEventKey } from '@prisma/client';

export type BaseDomainEvent = {
  eventId: string;
  occurredAt: Date;

  companyId: string;
  actorUserId?: string | null;
  requestId?: string | null;
};

export type CustomerCreatedEvent = BaseDomainEvent & {
  customerId: string;
};

export type DealStageChangedEvent = BaseDomainEvent & {
  dealId: string;
  customerId?: string | null;
  fromStage: string;
  toStage: string;
};

export type TaskOverdueEvent = BaseDomainEvent & {
  taskId: string;
  assigneeId?: string | null;
  customerId?: string | null;
  dueDate: Date;
};

export type DomainEventMap = {
  [WorkflowEventKey.customer_created]: CustomerCreatedEvent;
  [WorkflowEventKey.deal_stage_changed]: DealStageChangedEvent;
  [WorkflowEventKey.task_overdue]: TaskOverdueEvent;
};
