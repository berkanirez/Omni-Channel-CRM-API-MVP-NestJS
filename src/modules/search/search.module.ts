import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';
import { TenantModule } from 'src/common/tenant/tenant.module';

import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';

@Module({
  imports: [PrismaModule, LoggingModule, TenantModule],
  controllers: [SearchController],
  providers: [SearchService, PermissionsGuard, TenantContextGuard],
})
export class SearchModule {}
