import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';
import { TenantModule } from 'src/common/tenant/tenant.module';

import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { AuditModule } from 'src/common/audit/audit.module';

@Module({
  imports: [PrismaModule, LoggingModule, TenantModule, AuditModule],

  controllers: [TasksController],

  providers: [TasksService, PermissionsGuard, TenantContextGuard],
})
export class TasksModule {}
