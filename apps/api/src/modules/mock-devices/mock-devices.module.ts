// PROMPT_PNE_3 D1+D2+D4 — MockDevices module.
//
// Always loaded by AppModule but every controller endpoint short-circuits to
// 404 when DEMO_MODE != 'true' (see *.controller.ensureDemoMode methods).
// Production builds enforce a boot-time gate that refuses to start with
// DEMO_MODE unset (see main.ts).
//
// PNE_4_FOCUSED D2 — FastForwardController moved to WorkOrdersModule (it only
// uses StepExecutionService) so this module no longer depends on
// WorkOrdersModule. That breaks the previous circular dep and lets
// WorkOrdersModule import MockDevicesModule for the dispatcher (TODO-043).

import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EventsModule } from '../events/events.module'
import { DemoControllerService } from './demo-controller.service'
import { MockDevicesController } from './mock-devices.controller'
import { MockLeakTesterService } from './mock-leak-tester.service'
import { MockCameraTesterService } from './mock-camera-tester.service'
import { MockCrimpPressService } from './mock-crimp-press.service'
import { MockDeviceDispatcherService } from './mock-device-dispatcher.service'

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [MockDevicesController],
  providers: [
    DemoControllerService,
    MockLeakTesterService,
    MockCameraTesterService,
    MockCrimpPressService,
    MockDeviceDispatcherService,
  ],
  exports: [
    DemoControllerService,
    MockLeakTesterService,
    MockCameraTesterService,
    MockCrimpPressService,
    MockDeviceDispatcherService,
  ],
})
export class MockDevicesModule {}
