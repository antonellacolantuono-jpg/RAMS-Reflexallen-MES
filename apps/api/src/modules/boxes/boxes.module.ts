import { Module } from '@nestjs/common'
import { BoxesController } from './boxes.controller'
import { BoxesService } from './boxes.service'
import { BoxesRepository } from './boxes.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [BoxesController],
  providers: [BoxesService, BoxesRepository],
  exports: [BoxesService],
})
export class BoxesModule {}
