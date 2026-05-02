// PROMPT_PNE_3 D1 — MockDevices module.
//
// Always loaded by AppModule but every controller endpoint short-circuits to
// 404 when DEMO_MODE != 'true' (see MockDevicesController.ensureDemoMode).
// Production builds enforce a boot-time gate that refuses to start with
// DEMO_MODE unset (see main.ts).

import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EventsModule } from '../events/events.module'
import { DemoControllerService } from './demo-controller.service'
import { MockDevicesController } from './mock-devices.controller'
import { MockLeakTesterService } from './mock-leak-tester.service'

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [MockDevicesController],
  providers: [DemoControllerService, MockLeakTesterService],
  exports: [DemoControllerService, MockLeakTesterService],
})
export class MockDevicesModule {}
