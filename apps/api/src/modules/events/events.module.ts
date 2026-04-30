import { Module } from '@nestjs/common'
import { RegistryGateway } from './registry.gateway'
import { WorkOrderEventsGateway } from './work-order-events.gateway'

@Module({
  providers: [RegistryGateway, WorkOrderEventsGateway],
  exports: [RegistryGateway, WorkOrderEventsGateway],
})
export class EventsModule {}
