import { INestApplication } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { seedForE2E, SeedResult } from './test-seed';

export type E2EContext = {
  app: INestApplication;
  prisma: PrismaService;
  seed: SeedResult;
};

export async function setupE2E(): Promise<E2EContext> {
  const { app } = await createTestApp();
  const prisma = app.get(PrismaService);
  const seed = await seedForE2E(prisma);

  return { app, prisma, seed };
}

export async function teardownE2E(app?: INestApplication) {
  if (app) {
    await app.close();
  }
}
