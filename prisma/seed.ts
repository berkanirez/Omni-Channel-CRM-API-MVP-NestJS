import { PrismaClient } from '@prisma/client';
import { seedBase } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  await seedBase(prisma);
  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
