import { Injectable } from '@nestjs/common';
import { CommunicationChannel } from '../dto/test-send.dto';
import { ChannelProvider } from './types';

@Injectable()
export class ProvidersRegistry {
  private readonly map = new Map<CommunicationChannel, ChannelProvider>();

  constructor(providers: ChannelProvider[]) {
    for (const p of providers) this.map.set(p.channel, p);
  }

  get(channel: CommunicationChannel) {
    const p = this.map.get(channel);
    if (!p) throw new Error(`Provider not registered for channel=${channel}`);
    return p;
  }
}
