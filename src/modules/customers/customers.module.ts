import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';
import { TenantModule } from 'src/common/tenant/tenant.module';
import { AuditModule } from 'src/common/audit/audit.module';
import { EventsModule } from 'src/common/events/events.module';

@Module({
  imports: [
    PrismaModule,
    LoggingModule,
    TenantModule,
    AuditModule,
    EventsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
