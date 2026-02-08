import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/events/event-bus.service';
import { startTaskOverdueJob } from './jobs/task-overdue.job';

@Injectable()
export class WorkflowSchedulerService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    startTaskOverdueJob(this.prisma, this.bus);
  }
}
