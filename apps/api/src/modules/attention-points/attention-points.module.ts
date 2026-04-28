import { Module } from '@nestjs/common'
import { AttentionPointsController } from './attention-points.controller'
import { AttentionPointsService } from './attention-points.service'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [AttentionPointsController],
  providers: [AttentionPointsService],
  exports: [AttentionPointsService],
})
export class AttentionPointsModule {}
