// PROMPT_PNE_3 D2 — REST endpoints for the mock device demo controls.
//
// Routes live under /api/internal/* (debug-only namespace) per user spec to
// distinguish demo/debug surfaces from the production REST surface.
//
// Gated on DEMO_MODE=true. When DEMO_MODE is unset or false, every endpoint
// returns 404 (route invisible to production callers). Production builds MUST
// refuse to start with DEMO_MODE unset — see main.ts boot guard.

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { DemoControllerService } from './demo-controller.service'
import { MockLeakTesterService } from './mock-leak-tester.service'
import { MockCameraTesterService } from './mock-camera-tester.service'
import { MockCrimpPressService } from './mock-crimp-press.service'
import { ALL_OUTCOMES, type DeviceOutcome, type MockDevice } from './types'

// PROMPT_PNE_3 D4 hotfix #2 — public (no @UseGuards): the back-office /demo
// page must call these debug endpoints without a logged-in operator. DEMO_MODE
// is the safety gate (production refuses to boot with DEMO_MODE unset; every
// method below short-circuits to 404 when DEMO_MODE != 'true').
@Controller('internal/mock-devices')
export class MockDevicesController {
  constructor(
    private readonly demo: DemoControllerService,
    private readonly leakTester: MockLeakTesterService,
    private readonly cameraTester: MockCameraTesterService,
    private readonly crimpPress: MockCrimpPressService,
  ) {}

  @Get()
  list() {
    this.ensureDemoMode()
    return { devices: this.allDevices().map((d) => d.getStatus()) }
  }

  @Get(':deviceCode')
  status(@Param('deviceCode') deviceCode: string) {
    this.ensureDemoMode()
    return { device: this.resolveDevice(deviceCode).getStatus() }
  }

  @Post(':deviceCode/override-next')
  @HttpCode(HttpStatus.OK)
  overrideNext(@Param('deviceCode') deviceCode: string, @Body() body: unknown) {
    this.ensureDemoMode()
    const device = this.resolveDevice(deviceCode)
    const outcome = parseOutcomeBody(body, device.supportedOutcomes)
    this.demo.setNextOutcome(device.deviceSerialNumber, outcome)
    return {
      deviceSerialNumber: device.deviceSerialNumber,
      nextOutcome: outcome,
    }
  }

  @Post(':deviceCode/start-cycle')
  @HttpCode(HttpStatus.ACCEPTED)
  startCycle(@Param('deviceCode') deviceCode: string, @Body() body: unknown) {
    this.ensureDemoMode()
    const device = this.resolveDevice(deviceCode)
    const stepExecutionId = parseStepExecutionId(body)
    device.start(stepExecutionId)
    return {
      deviceSerialNumber: device.deviceSerialNumber,
      stepExecutionId,
      accepted: true,
    }
  }

  private ensureDemoMode(): void {
    if (process.env['DEMO_MODE'] !== 'true') {
      throw new NotFoundException()
    }
  }

  private allDevices(): MockDevice[] {
    return [this.leakTester, this.cameraTester, this.crimpPress]
  }

  private resolveDevice(deviceCode: string): MockDevice {
    const target = deviceCode.toUpperCase()
    const found = this.allDevices().find((d) => d.deviceSerialNumber === target)
    if (!found) {
      throw new NotFoundException(`Unknown mock device: ${deviceCode}`)
    }
    return found
  }
}

function parseOutcomeBody(
  body: unknown,
  supported: readonly DeviceOutcome[],
): DeviceOutcome {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException('Body required: { outcome: PASS|MARGINAL|FAIL }')
  }
  const value = (body as { outcome?: unknown }).outcome
  if (typeof value !== 'string' || !ALL_OUTCOMES.includes(value as DeviceOutcome)) {
    throw new BadRequestException(`outcome must be one of ${ALL_OUTCOMES.join(', ')}`)
  }
  const outcome = value as DeviceOutcome
  if (!supported.includes(outcome)) {
    throw new BadRequestException(
      `Device does not support ${outcome}; supported: ${supported.join(', ')}`,
    )
  }
  return outcome
}

function parseStepExecutionId(body: unknown): string {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException('Body required: { stepExecutionId: string }')
  }
  const value = (body as { stepExecutionId?: unknown }).stepExecutionId
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException('stepExecutionId is required')
  }
  return value
}
