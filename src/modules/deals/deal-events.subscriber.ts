// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { EventBusService } from 'src/common/events/event-bus.service';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { RequestContextService } from 'src/common/logger/request-context.service';

// @Injectable()
// export class DealEventsSubscriber implements OnModuleInit {
//   constructor(
//     private readonly eventBus: EventBusService,
//     private readonly prisma: PrismaService,
//     private readonly ctx: RequestContextService,
//   ) {}

//   onModuleInit() {
//     this.eventBus.on('DealStageChanged', async (event) => {
//       const requestId = this.ctx.getRequestId?.() ?? null;
//       const userId = this.ctx.getUserId?.() ?? event.payload.changedByUserId;

//       await this.prisma.auditLog.create({
//         data: {
//           action: 'deal:stage_changed',
//           entity: 'deal',
//           entityId: event.payload.dealId,
//           userId,
//           companyId: event.payload.companyId,
//           requestId,
//           metadata: {
//             oldStage: event.payload.oldStage,
//             newStage: event.payload.newStage,
//             customerId: event.payload.customerId,
//           },
//         },
//       });
//     });
//   }
// }
