import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';
import { AuditService } from './audit.service';

@Module({
  imports: [PrismaModule, LoggingModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
