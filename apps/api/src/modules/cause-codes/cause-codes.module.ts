import { Module } from '@nestjs/common'
import { CauseCodesController } from './cause-codes.controller'
import { CauseCodesService } from './cause-codes.service'
import { CauseCodesRepository } from './cause-codes.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [CauseCodesController],
  providers: [CauseCodesService, CauseCodesRepository],
  exports: [CauseCodesService],
})
export class CauseCodesModule {}
