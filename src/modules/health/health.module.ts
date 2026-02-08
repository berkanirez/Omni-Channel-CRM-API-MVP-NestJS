import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TenantModule } from 'src/common/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [HealthController],
})
export class HealthModule {}
