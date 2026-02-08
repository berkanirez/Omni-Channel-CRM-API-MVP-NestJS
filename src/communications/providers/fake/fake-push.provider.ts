import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommunicationChannel } from '../../dto/test-send.dto';
import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from '../types';

@Injectable()
export class FakePushProvider implements ChannelProvider {
  channel = CommunicationChannel.push;

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    return {
      provider: 'fake-push',
      providerMessageId: `push_${randomUUID()}`,
      raw: { ok: true, echo: { to: input.to } },
    };
  }
}
