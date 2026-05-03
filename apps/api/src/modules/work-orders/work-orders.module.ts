import { Module, forwardRef } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'
import { AutoGenEngineModule } from '../auto-gen-engine/auto-gen-engine.module'
import { MockDevicesModule } from '../mock-devices/mock-devices.module'
import { ToolsModule } from '../tools/tools.module'
import { FastForwardController } from '../mock-devices/fast-forward.controller'
import { WorkOrdersController } from './work-orders.controller'
import { WorkOrdersService } from './work-orders.service'
import { StepExecutionController } from './step-execution.controller'
import { StepExecutionService } from './step-execution.service'
import { ReleaseController } from './release.controller'
import { ReleaseService } from './release.service'

// PNE_4_FOCUSED D2 — MockDevicesModule imported with forwardRef so that even
// though MockDevicesModule no longer depends on WorkOrdersModule directly
// (FastForwardController moved here), TypeScript module-evaluation ordering
// stays robust against future cross-references. The dispatcher service it
// exports (MockDeviceDispatcherService) is consumed by StepExecutionService
// to wire the device cycle dispatch (TODO-043 closure).
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditLogModule,
    EventsModule,
    AutoGenEngineModule,
    forwardRef(() => MockDevicesModule),
    ToolsModule,
  ],
  controllers: [
    WorkOrdersController,
    StepExecutionController,
    ReleaseController,
    FastForwardController,
  ],
  providers: [WorkOrdersService, StepExecutionService, ReleaseService],
  exports: [WorkOrdersService, StepExecutionService, ReleaseService],
})
export class WorkOrdersModule {}
