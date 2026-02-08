import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowRuleDto } from './create-workflow-rule.dto';

export class UpdateWorkflowRuleDto extends PartialType(CreateWorkflowRuleDto) {}
