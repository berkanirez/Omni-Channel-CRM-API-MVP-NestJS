import { Injectable } from '@nestjs/common';
import twilio from 'twilio';
import { CommunicationChannel } from '../../dto/test-send.dto';
import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from '../types';
import { ProviderConfigError, ProviderTemporaryError } from '../errors';

function assertE164(phone: string) {
  if (!phone.startsWith('+') || phone.length < 8) {
    throw new Error(
      `SMS "to" must be E.164 format like +905551112233. got=${phone}`,
    );
  }
}

@Injectable()
export class TwilioSmsProvider implements ChannelProvider {
  channel = CommunicationChannel.sms;

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;

    if (!sid || !token || !from) {
      throw new Error(
        'Twilio env missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM)',
      );
    }

    assertE164(input.to);

    const client = twilio(sid, token);

    const msg = await client.messages.create({
      from,
      to: input.to,
      body: input.body ?? '',
    });

    return {
      provider: 'twilio',
      providerMessageId: msg.sid,
      raw: {
        sid: msg.sid,
        status: msg.status,
        to: msg.to,
        from: msg.from,
      },
    };
  }
  catch(e: any) {
    const message = String(e?.message ?? e);

    if (
      message.toLowerCase().includes('permission') ||
      message.toLowerCase().includes('not been enabled')
    ) {
      throw new ProviderConfigError(message);
    }

    if (
      message.toLowerCase().includes('timeout') ||
      message.toLowerCase().includes('rate') ||
      e?.status === 429
    ) {
      throw new ProviderTemporaryError(message);
    }

    throw e;
  }
}
