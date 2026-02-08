import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId?: string;
  userId?: string;
  companyId?: string;

  route?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextStore>();

  run(initial: RequestContextStore, fn: () => void) {
    this.als.run(initial, fn);
  }

  get(): RequestContextStore {
    return this.als.getStore() ?? {};
  }

  set(partial: Partial<RequestContextStore>) {
    const store = this.als.getStore();
    if (!store) return;
    Object.assign(store, partial);
  }

  getRequestId() {
    return this.get().requestId;
  }

  getUserId() {
    return this.get().userId;
  }

  getCompanyId() {
    return this.get().companyId;
  }
}
