export type CommunicationsMode = 'demo' | 'live';

export const communicationsConfig = {
  mode: (process.env.COMMUNICATIONS_MODE ?? 'demo') as CommunicationsMode,
  allowFakeFallback: process.env.COMMUNICATIONS_ALLOW_FAKE_FALLBACK === 'true',
};
