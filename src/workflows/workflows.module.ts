import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggingModule } from '../common/logger/logging.module';
import { WorkflowRulesController } from './workflow-rules.controller';
import { WorkflowRulesService } from './workflow-rules.service';
import { TenantModule } from 'src/common/tenant/tenant.module';
import { EventsModule } from 'src/common/events/events.module';
import { CommunicationsModule } from 'src/communications/communications.module';
import { WorkflowEngineService } from './workflow-engine.service';
import { ConditionEvaluatorService } from './evaluator/condition-evaluator.service';
import { WorkflowSchedulerService } from './workflow-scheduler.service';

@Module({
  imports: [
    PrismaModule,
    LoggingModule,
    TenantModule,
    EventsModule,
    CommunicationsModule,
  ],
  controllers: [WorkflowRulesController],
  providers: [
    WorkflowRulesService,
    WorkflowEngineService,
    ConditionEvaluatorService,
    WorkflowSchedulerService,
  ],
  exports: [WorkflowRulesService],
})
export class WorkflowsModule {}
