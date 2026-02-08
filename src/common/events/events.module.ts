import { Module } from '@nestjs/common';
import { EventBus } from './event-bus.service';

@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class EventsModule {}
