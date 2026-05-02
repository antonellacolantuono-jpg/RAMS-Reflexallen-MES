// PROMPT_PNE_3 D1 — REST endpoints for the mock device demo controls.
//
// Gated on DEMO_MODE=true. When DEMO_MODE is unset or false, every endpoint
// returns 404 (route invisible to production callers). Production builds MUST
// refuse to start with DEMO_MODE unset — see main.ts boot guard.
//
// Auth: mirrors the rest of the API (JwtAuthGuard). Demo-mode does NOT mean
// "no auth" — it just means the simulators are wired in.

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
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { DemoControllerService } from './demo-controller.service'
import { MockLeakTesterService } from './mock-leak-tester.service'
import { ALL_OUTCOMES, type DeviceOutcome, type MockDevice } from './types'

@Controller('mock-devices')
@UseGuards(JwtAuthGuard)
export class MockDevicesController {
  constructor(
    private readonly demo: DemoControllerService,
    private readonly leakTester: MockLeakTesterService,
  ) {}

  @Get()
  list() {
    this.ensureDemoMode()
    return { devices: this.allDevices().map((d) => d.getStatus()) }
  }

  @Get(':deviceCode/status')
  status(@Param('deviceCode') deviceCode: string) {
    this.ensureDemoMode()
    return { device: this.resolveDevice(deviceCode).getStatus() }
  }

  @Post(':deviceCode/next-outcome')
  @HttpCode(HttpStatus.OK)
  setNextOutcome(@Param('deviceCode') deviceCode: string, @Body() body: unknown) {
    this.ensureDemoMode()
    const device = this.resolveDevice(deviceCode)
    const outcome = parseOutcomeBody(body, device.supportedOutcomes)
    this.demo.setNextOutcome(device.deviceSerialNumber, outcome)
    return {
      deviceSerialNumber: device.deviceSerialNumber,
      nextOutcome: outcome,
    }
  }

  @Post(':deviceCode/start-test')
  @HttpCode(HttpStatus.ACCEPTED)
  startTest(@Param('deviceCode') deviceCode: string, @Body() body: unknown) {
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
    return [this.leakTester]
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
