import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantContextGuard } from '../guards/tenant-context.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TenantResolverService, TenantContextGuard],
  exports: [TenantResolverService, TenantContextGuard],
})
export class TenantModule {}
