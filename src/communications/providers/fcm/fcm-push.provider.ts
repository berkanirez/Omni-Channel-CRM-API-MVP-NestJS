import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CommunicationChannel } from '../../dto/test-send.dto';
import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from '../types';
import { ProviderConfigError, ProviderTemporaryError } from '../errors';

@Injectable()
export class FcmPushProvider implements ChannelProvider {
  channel = CommunicationChannel.push;

  constructor() {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,

          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        } as admin.ServiceAccount),
      });
    }
  }

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    const token = input.to;

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: input.subject ?? 'Notification',
        body: input.body ?? '',
      },

      data: input.variables
        ? Object.fromEntries(
            Object.entries(input.variables).map(([k, v]) => [k, String(v)]),
          )
        : undefined,
    };

    const messageId = await admin.messaging().send(message);

    return {
      provider: 'fcm',
      providerMessageId: messageId,
      raw: { messageId },
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
