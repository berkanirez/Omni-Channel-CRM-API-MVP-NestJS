import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { WorkflowEventKey } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { setupE2E, teardownE2E } from '../helpers/e2e-context';
import { login, authHeader } from '../helpers/auth';
import { SeedResult } from '../helpers/test-seed';

async function waitFor<T>(
  fn: () => Promise<T | null>,
  {
    timeoutMs = 2000,
    intervalMs = 50,
  }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<T> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await fn();
    if (res) return res;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`waitFor timeout after ${timeoutMs}ms`);
}

describe('Full E2E Flow (customer -> deal -> stage -> workflow -> message -> record)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seed: SeedResult;

  beforeAll(async () => {
    const ctx = await setupE2E();
    app = ctx.app;
    prisma = ctx.prisma;
    seed = ctx.seed;
  });

  afterAll(async () => {
    await teardownE2E(app);
  });

  it('Deal stage change triggers workflow and creates CommunicationRecord', async () => {
    const token = await login(app, {
      email: seed.users.acmeAdmin.email,
      password: seed.passwordPlain,
      companySlug: seed.companies.acme.slug,
    });

    const companyId = seed.companies.acme.id;

    await prisma.workflowRule.create({
      data: {
        companyId,
        name: 'E2E: deal_stage_changed -> SMS',
        eventKey: WorkflowEventKey.deal_stage_changed,
        enabled: true,
        conditions: {},
        action: {
          type: 'sendMessage',
          channel: 'sms',
          to: { source: 'customer.phone' },
          body: 'Deal stage changed to: {{toStage}}',
          variables: {},
          templateKey: null,
        },
      },
    });

    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(token))
      .send({
        name: 'E2E Customer',
        email: 'e2e.customer@test.com',
        phone: '+905551112233',
      })
      .expect(201);

    const customerId = customerRes.body?.data?.id ?? customerRes.body?.id;
    expect(customerId).toBeTruthy();

    const dealRes = await request(app.getHttpServer())
      .post('/deals')
      .set(authHeader(token))
      .send({
        customerId,
        title: 'E2E Deal',
        value: 1000,
        currency: 'TRY',
      })
      .expect(201);

    const dealId = dealRes.body?.data?.id ?? dealRes.body?.id;
    expect(dealId).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/deals/${dealId}/stage`)
      .set(authHeader(token))
      .send({ stage: 'qualified' })
      .expect(200);

    const record = await waitFor(
      () =>
        prisma.communicationRecord.findFirst({
          where: {
            companyId,
            dealId,
            customerId,
            channel: 'sms',
          },
          orderBy: { createdAt: 'desc' },
        }),
      { timeoutMs: 3000, intervalMs: 50 },
    );

    expect(record).toBeTruthy();
    expect(record.payloadSnapshot?.to).toBe('+905551112233');
    expect(['queued', 'sent', 'failed']).toContain(record.status);
  });
});
