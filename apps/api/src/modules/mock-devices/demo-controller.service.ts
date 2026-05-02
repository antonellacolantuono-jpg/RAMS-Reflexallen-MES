// PROMPT_PNE_3 D1 — In-memory store for the "force next outcome" override.
//
// One Map keyed by Device.serialNumber (the PROMPT-spec device code, e.g.
// DEV-LEAK-001). Override is consumed at cycle start and reverts to the
// device's default outcome.

import { Injectable } from '@nestjs/common'
import type { DeviceOutcome } from './types'

@Injectable()
export class DemoControllerService {
  private readonly nextOutcome = new Map<string, DeviceOutcome>()

  setNextOutcome(deviceSerialNumber: string, outcome: DeviceOutcome): void {
    this.nextOutcome.set(this.normalize(deviceSerialNumber), outcome)
  }

  /** Returns the override, removing it. Use at cycle start. */
  consumeNextOutcome(deviceSerialNumber: string): DeviceOutcome | null {
    const key = this.normalize(deviceSerialNumber)
    const value = this.nextOutcome.get(key) ?? null
    if (value !== null) this.nextOutcome.delete(key)
    return value
  }

  /** Returns the override without removing it. For status queries. */
  peekNextOutcome(deviceSerialNumber: string): DeviceOutcome | null {
    return this.nextOutcome.get(this.normalize(deviceSerialNumber)) ?? null
  }

  clearOverride(deviceSerialNumber: string): void {
    this.nextOutcome.delete(this.normalize(deviceSerialNumber))
  }

  clearAll(): void {
    this.nextOutcome.clear()
  }

  private normalize(deviceSerialNumber: string): string {
    return deviceSerialNumber.toUpperCase()
  }
}
