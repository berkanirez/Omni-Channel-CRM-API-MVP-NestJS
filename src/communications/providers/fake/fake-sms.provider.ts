import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommunicationChannel } from '../../dto/test-send.dto';
import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from '../types';

@Injectable()
export class FakeSmsProvider implements ChannelProvider {
  channel = CommunicationChannel.sms;

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    return {
      provider: 'fake-sms',
      providerMessageId: `sms_${randomUUID()}`,
      raw: { ok: true, echo: { to: input.to } },
    };
  }
}
