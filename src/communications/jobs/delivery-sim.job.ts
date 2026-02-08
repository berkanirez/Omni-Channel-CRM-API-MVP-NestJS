import cron from 'node-cron';
import { PrismaService } from '../../prisma/prisma.service';

export function startDeliverySimJob(prisma: PrismaService) {
  cron.schedule('*/20 * * * * *', async () => {
    const sent = await prisma.communicationRecord.findMany({
      where: {
        status: 'sent',
        deliveredAt: null,
      },
      orderBy: { sentAt: 'asc' },
      take: 50,
    });

    for (const rec of sent) {
      await prisma.communicationRecord.update({
        where: { id: rec.id },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
        },
      });
    }
  });
}
