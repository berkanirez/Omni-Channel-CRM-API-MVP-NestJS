import { BadRequestException } from '@nestjs/common';
import { CommunicationChannel } from '../dto/test-send.dto';

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPhone(v: string) {
  const digitsOnly = /^[0-9]{10,15}$/;
  const e164 = /^\+[1-9]\d{7,14}$/;
  return digitsOnly.test(v) || e164.test(v);
}

export function validateRecipient(channel: CommunicationChannel, to: string) {
  if (!to || typeof to !== 'string') {
    throw new BadRequestException(`Recipient "to" is required`);
  }

  if (channel === CommunicationChannel.email) {
    if (!isValidEmail(to))
      throw new BadRequestException(`Invalid email: ${to}`);
  }

  if (channel === CommunicationChannel.sms) {
    if (!isValidPhone(to))
      throw new BadRequestException(`Invalid phone: ${to}`);
  }

  if (channel === CommunicationChannel.push) {
    if (to.length < 10) throw new BadRequestException(`Invalid push token`);
  }
}
