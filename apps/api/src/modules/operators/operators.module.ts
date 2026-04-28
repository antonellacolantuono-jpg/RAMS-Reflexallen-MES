import { Module } from '@nestjs/common'
import { OperatorsController } from './operators.controller'
import { OperatorsService } from './operators.service'
import { OperatorsRepository } from './operators.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [OperatorsController],
  providers: [OperatorsService, OperatorsRepository],
  exports: [OperatorsService],
})
export class OperatorsModule {}
