import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from './../prisma/prisma.service';
import { LoggingModule } from '../common/logger/logging.module';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { MessageService } from './message.service';
import { ProvidersRegistry } from './providers/registry';
import {
  EMAIL_PROVIDER,
  SMS_PROVIDER,
  PUSH_PROVIDER,
} from './providers/tokens';
import { FakeEmailProvider } from './providers/fake/fake-email.provider';
import { FakeSmsProvider } from './providers/fake/fake-sms.provider';
import { FakePushProvider } from './providers/fake/fake-push.provider';
import { TemplatesModule } from 'src/templates/templates.module';
import { startRetryJob } from './jobs/retry.job';
import { startDeliverySimJob } from './jobs/delivery-sim.job';
import { ResendEmailProvider } from './providers/resend/resend-email.provider';
import { TwilioSmsProvider } from './providers/twilio/twilio-sms.provider';
import { FcmPushProvider } from './providers/fcm/fcm-push.provider';
import { FallbackProvider } from './providers/fallback.provider';

@Module({
  imports: [PrismaModule, LoggingModule, TemplatesModule],
  controllers: [CommunicationsController],
  providers: [
    CommunicationsService,
    MessageService,
    ResendEmailProvider,
    FakeEmailProvider,
    TwilioSmsProvider,
    FakeSmsProvider,
    FcmPushProvider,
    FakePushProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (real: ResendEmailProvider, fake: FakeEmailProvider) => {
        const isTest = process.env.NODE_ENV === 'test';
        const mode = process.env.COMMUNICATIONS_MODE ?? 'demo';
        const allowFallback =
          process.env.COMMUNICATIONS_ALLOW_FAKE_FALLBACK === 'true';

        if (isTest || mode === 'demo') return fake;
        if (!allowFallback) return real;

        return new FallbackProvider(real, fake, true);
      },
      inject: [ResendEmailProvider, FakeEmailProvider],
    },
    {
      provide: SMS_PROVIDER,
      useFactory: (real: TwilioSmsProvider, fake: FakeSmsProvider) => {
        const isTest = process.env.NODE_ENV === 'test';
        const mode = process.env.COMMUNICATIONS_MODE ?? 'demo';
        const allowFallback =
          process.env.COMMUNICATIONS_ALLOW_FAKE_FALLBACK === 'true';

        if (isTest || mode === 'demo') return fake;
        if (!allowFallback) return real;

        return new FallbackProvider(real, fake, true);
      },
      inject: [TwilioSmsProvider, FakeSmsProvider],
    },
    {
      provide: PUSH_PROVIDER,
      useFactory: (real: FcmPushProvider, fake: FakePushProvider) => {
        const isTest = process.env.NODE_ENV === 'test';
        const mode = process.env.COMMUNICATIONS_MODE ?? 'demo';
        const allowFallback =
          process.env.COMMUNICATIONS_ALLOW_FAKE_FALLBACK === 'true';

        if (isTest || mode === 'demo') return fake;
        if (!allowFallback) return real;

        return new FallbackProvider(real, fake, true);
      },
      inject: [FcmPushProvider, FakePushProvider],
    },
    {
      provide: ProvidersRegistry,
      useFactory: (email: any, sms: any, push: any) =>
        new ProvidersRegistry([email, sms, push]),
      inject: [EMAIL_PROVIDER, SMS_PROVIDER, PUSH_PROVIDER],
    },
  ],
  exports: [MessageService],
})
export class CommunicationsModule implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    const isTest = process.env.NODE_ENV === 'test';
    const mode = process.env.COMMUNICATIONS_MODE ?? 'demo';

    if (!isTest) {
      startRetryJob(this.prisma, this.messageService);
    }

    if (mode === 'demo') {
      startDeliverySimJob(this.prisma);
    }
  }
}
