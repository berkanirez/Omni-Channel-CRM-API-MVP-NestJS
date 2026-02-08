import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';
import { TenantModule } from 'src/common/tenant/tenant.module';
import { EventsModule } from 'src/common/events/events.module';

import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
// import { DealEventsSubscriber } from './deal-events.subscriber';

import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { AuditModule } from 'src/common/audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    LoggingModule,
    TenantModule,
    EventsModule,
    AuditModule,
  ],
  controllers: [DealsController],
  providers: [
    DealsService,
    // DealEventsSubscriber,
    PermissionsGuard,
    TenantContextGuard,
  ],
})
export class DealsModule {}
