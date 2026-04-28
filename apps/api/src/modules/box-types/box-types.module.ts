import { Module } from '@nestjs/common'
import { BoxTypesController } from './box-types.controller'
import { BoxTypesService } from './box-types.service'
import { BoxTypesRepository } from './box-types.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [BoxTypesController],
  providers: [BoxTypesService, BoxTypesRepository],
  exports: [BoxTypesService],
})
export class BoxTypesModule {}
