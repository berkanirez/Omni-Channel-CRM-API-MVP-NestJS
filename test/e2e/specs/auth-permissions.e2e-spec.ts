import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { login, authHeader } from '../helpers/auth';
import { E2EContext, setupE2E, teardownE2E } from '../helpers/e2e-context';

describe('Auth + Permissions (e2e)', () => {
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

  it('Token yoksa -> 401', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .send({ name: 'X', email: 'x@x.com' })
      .expect(401);
  });

  it('Yetki yoksa -> 403', async () => {
    const token = await login(app, {
      email: seed.users.acmeMember.email,
      password: seed.passwordPlain,
      companySlug: seed.companies.acme.slug,
    });

    await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(token))
      .send({ name: 'NoPerm', email: 'noperm@test.com' })
      .expect(403);
  });

  it('Admin -> customer create -> 201', async () => {
    const token = await login(app, {
      email: seed.users.acmeAdmin.email,
      password: seed.passwordPlain,
      companySlug: seed.companies.acme.slug,
    });

    await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(token))
      .send({ name: 'Perm OK', email: 'permok@test.com' })
      .expect(201);
  });
});
