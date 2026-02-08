import { CommunicationChannel } from '../dto/test-send.dto';

export type ProviderSendInput = {
  to: string;
  subject?: string;
  body?: string;
  templateKey?: string;
  variables?: Record<string, any>;
};

export type ProviderSendResult = {
  provider: string;
  providerMessageId?: string;
  raw?: any;
};

export type ChannelProvider = {
  channel: CommunicationChannel;
  send(input: ProviderSendInput): Promise<ProviderSendResult>;
};
