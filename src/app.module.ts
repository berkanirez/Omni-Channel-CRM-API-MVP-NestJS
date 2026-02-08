import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './common/logger/request-id.middleware';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { AuditModule } from './modules/audit/audit.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggingModule } from './common/logger/logging.module';
import { HttpLoggingMiddleware } from './common/logger/http-logging.middleware';
import { CustomersModule } from './modules/customers/customers.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DealsModule } from './modules/deals/deals.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SearchModule } from './modules/search/search.module';
import { RequestMetaMiddleware } from './common/logger/request-meta.middleware';
import { CommunicationsModule } from './communications/communications.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    AuthModule,
    AuditModule,
    LoggingModule,
    CustomersModule,
    ContactsModule,
    DealsModule,
    TasksModule,
    SearchModule,
    CommunicationsModule,
    WorkflowsModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: process.env.NODE_ENV === 'test' ? 1000 : 60,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestMetaMiddleware, HttpLoggingMiddleware)
      .forRoutes('*');
  }
}
