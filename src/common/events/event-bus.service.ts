import { Injectable } from '@nestjs/common';
import { DomainEventMap } from './domain-events';

type Handler<K extends keyof DomainEventMap> = (
  payload: DomainEventMap[K],
) => void | Promise<void>;

@Injectable()
export class EventBus {
  private readonly handlers = new Map<string, Function[]>();

  subscribe<K extends keyof DomainEventMap>(key: K, handler: Handler<K>) {
    const k = String(key);
    const list = this.handlers.get(k) ?? [];
    list.push(handler);
    this.handlers.set(k, list);
  }

  async publish<K extends keyof DomainEventMap>(
    key: K,
    payload: DomainEventMap[K],
  ) {
    const k = String(key);
    const list = (this.handlers.get(k) ?? []) as Handler<K>[];

    for (const h of list) {
      await h(payload);
    }
  }
}
