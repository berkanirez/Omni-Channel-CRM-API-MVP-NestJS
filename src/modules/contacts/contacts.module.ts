import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';
import { TenantModule } from 'src/common/tenant/tenant.module';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { AuditModule } from 'src/common/audit/audit.module';

@Module({
  imports: [PrismaModule, LoggingModule, TenantModule, AuditModule],
  controllers: [ContactsController],
  providers: [ContactsService, PermissionsGuard, TenantContextGuard],
})
export class ContactsModule {}
