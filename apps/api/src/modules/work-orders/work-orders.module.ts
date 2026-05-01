import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'
import { WorkOrdersController } from './work-orders.controller'
import { WorkOrdersService } from './work-orders.service'
import { StepExecutionController } from './step-execution.controller'
import { StepExecutionService } from './step-execution.service'
import { ReleaseController } from './release.controller'
import { ReleaseService } from './release.service'

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule, EventsModule],
  controllers: [WorkOrdersController, StepExecutionController, ReleaseController],
  providers: [WorkOrdersService, StepExecutionService, ReleaseService],
  exports: [WorkOrdersService, StepExecutionService, ReleaseService],
})
export class WorkOrdersModule {}
