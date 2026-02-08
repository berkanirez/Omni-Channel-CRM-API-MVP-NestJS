import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionsGuard } from '../guards/permissions.guard';

@Module({
  imports: [PrismaModule],
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class RbacModule {}
