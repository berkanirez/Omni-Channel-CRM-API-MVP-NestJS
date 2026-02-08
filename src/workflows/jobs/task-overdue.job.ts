import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../common/events/event-bus.service';
import { WorkflowEventKey } from '@prisma/client';
import { TaskOverdueEvent } from 'src/common/events/domain-events';

export function startTaskOverdueJob(prisma: PrismaService, bus: EventBus) {
  cron.schedule('*/1 * * * *', async () => {
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        dueDate: { lt: now },
        overdueEventSentAt: null,
        status: { not: 'done' as any },
      },
      select: {
        id: true,
        companyId: true,
        dueDate: true,
        assigneeId: true,
        customerId: true,
      },
      take: 50,
    });

    if (tasks.length === 0) return;

    console.log(`[CRON] overdue tasks found=${tasks.length}`);

    for (const t of tasks) {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.task.findFirst({
          where: { id: t.id, overdueEventSentAt: null },
          select: { id: true },
        });

        if (!fresh) return;

        await tx.task.update({
          where: { id: t.id },
          data: { overdueEventSentAt: now },
        });

        await bus.publish(WorkflowEventKey.task_overdue, {
          eventId: randomUUID(),
          occurredAt: now,
          companyId: t.companyId,
          actorUserId: null,
          requestId: null,

          taskId: t.id,
          assigneeId: t.assigneeId ?? null,
          dueDate: t.dueDate!,
          customerId: t.customerId ?? null,
        } as TaskOverdueEvent);

        console.log('[BUS] publishing task_overdue', { taskId: t.id });
      });
    }
  });
}
