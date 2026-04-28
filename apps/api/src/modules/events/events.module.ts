import { Module } from '@nestjs/common'
import { RegistryGateway } from './registry.gateway'

@Module({
  providers: [RegistryGateway],
  exports: [RegistryGateway],
})
export class EventsModule {}
