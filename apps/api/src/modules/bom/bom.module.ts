import { Module } from '@nestjs/common'
import { BomController } from './bom.controller'
import { BomService } from './bom.service'
import { BomRepository } from './bom.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [BomController],
  providers: [BomService, BomRepository],
  exports: [BomService],
})
export class BomModule {}
