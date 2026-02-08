import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { CommunicationChannel } from '../../dto/test-send.dto';
import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from '../types';
import { ProviderConfigError, ProviderTemporaryError } from '../errors';

@Injectable()
export class ResendEmailProvider implements ChannelProvider {
  channel = CommunicationChannel.email;

  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    this.resend = new Resend(apiKey);
  }

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    const from = process.env.EMAIL_FROM;
    if (!from) throw new Error('EMAIL_FROM is not set');

    const subject = input.subject ?? '(no subject)';

    const html = input.body ?? '';

    const { data, error } = await this.resend.emails.send({
      from,
      to: input.to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message ?? 'Resend send failed');
    }

    return {
      provider: 'resend',
      providerMessageId: data?.id,
      raw: { id: data?.id },
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
