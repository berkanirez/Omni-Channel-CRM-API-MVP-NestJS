import {
  ChannelProvider,
  ProviderSendInput,
  ProviderSendResult,
} from './types';
import { ProviderConfigError } from './errors';

export class FallbackProvider implements ChannelProvider {
  channel: any;

  constructor(
    private readonly primary: ChannelProvider,
    private readonly fallback: ChannelProvider,
    private readonly allowFallback: boolean,
  ) {
    this.channel = primary.channel;
  }

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    try {
      return await this.primary.send(input);
    } catch (e: any) {
      if (this.allowFallback && e instanceof ProviderConfigError) {
        const r = await this.fallback.send(input);
        return { ...r, provider: `fallback:${r.provider}` };
      }
      throw e;
    }
  }
}
