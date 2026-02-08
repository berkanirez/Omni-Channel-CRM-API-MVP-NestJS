import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { AppLogger } from './app-logger.service';

@Global()
@Module({
  providers: [RequestContextService, AppLogger],
  exports: [RequestContextService, AppLogger],
})
export class LoggingModule {}
