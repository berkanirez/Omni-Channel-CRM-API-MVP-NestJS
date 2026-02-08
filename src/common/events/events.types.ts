export type DealStageChangedEvent = {
  type: 'DealStageChanged';
  payload: {
    dealId: string;
    companyId: string;
    customerId: string;
    oldStage: string;
    newStage: string;
    changedByUserId: string;
    occurredAt: string;
  };
};

export type CustomerCreatedEvent = {
  type: 'CustomerCreated';
  payload: {
    customerId: string;
    companyId: string;
    createdByUserId: string;
    occurredAt: string;
  };
};

export type TaskOverdueEvent = {
  type: 'TaskOverdue';
  payload: {
    taskId: string;
    companyId: string;
    assigneeId: string;
    dueDate: string;
    occurredAt: string;
  };
};

export type AppEvent =
  | DealStageChangedEvent
  | CustomerCreatedEvent
  | TaskOverdueEvent;
