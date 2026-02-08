import request from 'supertest';
import { INestApplication } from '@nestjs/common';

type LoginParams = {
  email: string;
  password: string;
  companySlug: string;
};

export async function login(
  app: INestApplication,
  params: LoginParams,
): Promise<string>;
export async function login(
  app: INestApplication,
  email: string,
  password: string,
  companySlug: string,
): Promise<string>;
export async function login(
  app: INestApplication,
  arg1: LoginParams | string,
  arg2?: string,
  arg3?: string,
): Promise<string> {
  const params =
    typeof arg1 === 'string'
      ? { email: arg1, password: arg2 ?? '', companySlug: arg3 ?? '' }
      : arg1;

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send(params)
    .expect(201);

  const token = res.body?.accessToken;
  if (!token) throw new Error('Login did not return accessToken');

  return token as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
