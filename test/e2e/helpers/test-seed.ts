import { PrismaService } from '../../../src/prisma/prisma.service';
import { seedBase } from '../../../prisma/seed-data';

export type SeedResult = Awaited<ReturnType<typeof seedBase>>;

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany();
    await tx.userRole.deleteMany();
    await tx.userCompany.deleteMany();
    await tx.customerTag.deleteMany();
    await tx.dealTag.deleteMany();
    await tx.taskTag.deleteMany();
    await tx.communicationRecord.deleteMany();
    await tx.communicationTemplate.deleteMany();
    await tx.workflowRule.deleteMany();
    await tx.note.deleteMany();
    await tx.contact.deleteMany();
    await tx.task.deleteMany();
    await tx.deal.deleteMany();
    await tx.customer.deleteMany();
    await tx.tag.deleteMany();
    await tx.role.deleteMany();
    await tx.permission.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.user.deleteMany();
    await tx.company.deleteMany();
  });
}

export async function seedForE2E(prisma: PrismaService) {
  await resetDatabase(prisma);
  return seedBase(prisma as any);
}
