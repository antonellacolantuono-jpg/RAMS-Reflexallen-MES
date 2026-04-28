import { Module } from '@nestjs/common'
import { EquipmentController } from './equipment.controller'
import { EquipmentService } from './equipment.service'
import { EquipmentRepository } from './equipment.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [EquipmentController],
  providers: [EquipmentService, EquipmentRepository],
  exports: [EquipmentService],
})
export class EquipmentModule {}
