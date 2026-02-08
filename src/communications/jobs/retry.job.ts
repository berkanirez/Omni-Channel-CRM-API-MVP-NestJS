import cron from 'node-cron';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageService } from '../message.service';
import { RETRY_LIMIT } from '../constants/communication.constants';

export function startRetryJob(
  prisma: PrismaService,
  messageService: MessageService,
) {
  cron.schedule('*/30 * * * * *', async () => {
    const now = new Date();

    const retryables = await prisma.communicationRecord.findMany({
      where: {
        status: 'failed',
        retryCount: { lt: RETRY_LIMIT },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    });

    for (const rec of retryables) {
      await messageService.attemptSend(rec.id);
    }
  });
}
