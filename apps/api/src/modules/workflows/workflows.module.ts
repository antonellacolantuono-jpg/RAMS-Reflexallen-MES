import { Module } from '@nestjs/common'
import { WorkflowsController } from './workflows.controller'
import { WorkflowsService } from './workflows.service'
import { WorkflowsRepository } from './workflows.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsRepository],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
