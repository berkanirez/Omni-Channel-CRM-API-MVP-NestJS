import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { WorkflowRulesService } from './workflow-rules.service';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';

@ApiTags('workflow-rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('workflow-rules')
export class WorkflowRulesController {
  constructor(private readonly svc: WorkflowRulesService) {}

  @Permissions('workflow:manage')
  @Post()
  create(@Body() dto: CreateWorkflowRuleDto) {
    return this.svc.create(dto);
  }

  @Permissions('workflow:read')
  @Get()
  list(@Query('eventKey') eventKey?: string) {
    return this.svc.list(eventKey);
  }

  @Permissions('workflow:read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Permissions('workflow:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowRuleDto) {
    return this.svc.update(id, dto);
  }

  @Permissions('workflow:manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
