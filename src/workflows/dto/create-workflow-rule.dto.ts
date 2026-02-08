import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum WorkflowEventKey {
  customer_created = 'customer_created',
  deal_stage_changed = 'deal_stage_changed',
  task_overdue = 'task_overdue',
}

export class CreateWorkflowRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(WorkflowEventKey)
  eventKey: WorkflowEventKey;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @IsObject()
  action: Record<string, any>;
}
