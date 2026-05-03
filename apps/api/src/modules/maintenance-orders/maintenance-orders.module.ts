import { Module } from '@nestjs/common'
import { MaintenanceOrdersController } from './maintenance-orders.controller'
import { MaintenanceOrdersService } from './maintenance-orders.service'
import { MaintenanceOrdersRepository } from './maintenance-orders.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [MaintenanceOrdersController],
  providers: [MaintenanceOrdersService, MaintenanceOrdersRepository],
  exports: [MaintenanceOrdersService],
})
export class MaintenanceOrdersModule {}
