import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/common/logger/logging.module';

@Module({
  imports: [PrismaModule, LoggingModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
