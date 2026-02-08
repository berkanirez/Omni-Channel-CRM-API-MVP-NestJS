import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommunicationChannel } from '../../dto/test-send.dto';
import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from '../types';

@Injectable()
export class FakeEmailProvider implements ChannelProvider {
  channel = CommunicationChannel.email;

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    return {
      provider: 'fake-email',
      providerMessageId: `email_${randomUUID()}`,
      raw: { ok: true, echo: { to: input.to } },
    };
  }
}
