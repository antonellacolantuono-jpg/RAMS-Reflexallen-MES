import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'
import { WorkOrdersController } from './work-orders.controller'
import { WorkOrdersService } from './work-orders.service'
import { StepExecutionController } from './step-execution.controller'
import { StepExecutionService } from './step-execution.service'

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule, EventsModule],
  controllers: [WorkOrdersController, StepExecutionController],
  providers: [WorkOrdersService, StepExecutionService],
  exports: [WorkOrdersService, StepExecutionService],
})
export class WorkOrdersModule {}
