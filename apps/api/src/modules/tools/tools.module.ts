import { Module } from '@nestjs/common'
import { ToolsController } from './tools.controller'
import { ToolsService } from './tools.service'
import { ToolsRepository } from './tools.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [ToolsController],
  providers: [ToolsService, ToolsRepository],
  exports: [ToolsService],
})
export class ToolsModule {}
