// PROMPT_PNE_3 D1+D2+D4 — MockDevices module.
//
// Always loaded by AppModule but every controller endpoint short-circuits to
// 404 when DEMO_MODE != 'true' (see *.controller.ensureDemoMode methods).
// Production builds enforce a boot-time gate that refuses to start with
// DEMO_MODE unset (see main.ts).

import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EventsModule } from '../events/events.module'
import { WorkOrdersModule } from '../work-orders/work-orders.module'
import { DemoControllerService } from './demo-controller.service'
import { FastForwardController } from './fast-forward.controller'
import { MockDevicesController } from './mock-devices.controller'
import { MockLeakTesterService } from './mock-leak-tester.service'
import { MockCameraTesterService } from './mock-camera-tester.service'
import { MockCrimpPressService } from './mock-crimp-press.service'

@Module({
  imports: [AuthModule, EventsModule, WorkOrdersModule],
  controllers: [MockDevicesController, FastForwardController],
  providers: [
    DemoControllerService,
    MockLeakTesterService,
    MockCameraTesterService,
    MockCrimpPressService,
  ],
  exports: [
    DemoControllerService,
    MockLeakTesterService,
    MockCameraTesterService,
    MockCrimpPressService,
  ],
})
export class MockDevicesModule {}
