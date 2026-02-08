export class ProviderConfigError extends Error {
  readonly kind = 'config';
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigError';
  }
}

export class ProviderTemporaryError extends Error {
  readonly kind = 'temporary';
  constructor(message: string) {
    super(message);
    this.name = 'ProviderTemporaryError';
  }
}
