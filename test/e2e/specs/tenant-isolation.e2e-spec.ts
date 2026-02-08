import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { login, authHeader } from '../helpers/auth';
import { E2EContext, setupE2E, teardownE2E } from '../helpers/e2e-context';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let seed: E2EContext['seed'];

  beforeAll(async () => {
    const ctx = await setupE2E();
    app = ctx.app;
    seed = ctx.seed;
  });

  afterAll(async () => {
    await teardownE2E(app);
  });

  it('Company A customer -> Company B erisemez', async () => {
    const tokenA = await login(app, {
      email: seed.users.acmeAdmin.email,
      password: seed.passwordPlain,
      companySlug: seed.companies.acme.slug,
    });
    const tokenB = await login(app, {
      email: seed.users.betaAdmin.email,
      password: seed.passwordPlain,
      companySlug: seed.companies.beta.slug,
    });

    const created = await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(tokenA))
      .send({ name: 'Tenant A Customer', email: 'tenantA@test.com' })
      .expect(201);

    const customerId = created.body?.data?.id ?? created.body?.id;
    expect(customerId).toBeTruthy();

    const res = await request(app.getHttpServer())
      .get(`/customers/${customerId}`)
      .set(authHeader(tokenB));

    expect([403, 404]).toContain(res.status);
  });
});
