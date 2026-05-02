import { describe, it, expect, beforeEach } from 'vitest'
import { DemoControllerService } from './demo-controller.service'

describe('DemoControllerService', () => {
  let svc: DemoControllerService

  beforeEach(() => {
    svc = new DemoControllerService()
  })

  it('setNextOutcome + consumeNextOutcome returns then clears the override', () => {
    svc.setNextOutcome('DEV-LEAK-001', 'FAIL')
    expect(svc.consumeNextOutcome('DEV-LEAK-001')).toBe('FAIL')
    expect(svc.consumeNextOutcome('DEV-LEAK-001')).toBeNull()
  })

  it('peekNextOutcome does not consume the override', () => {
    svc.setNextOutcome('DEV-LEAK-001', 'MARGINAL')
    expect(svc.peekNextOutcome('DEV-LEAK-001')).toBe('MARGINAL')
    expect(svc.peekNextOutcome('DEV-LEAK-001')).toBe('MARGINAL')
    expect(svc.consumeNextOutcome('DEV-LEAK-001')).toBe('MARGINAL')
    expect(svc.peekNextOutcome('DEV-LEAK-001')).toBeNull()
  })

  it('overrides are scoped per device and case-insensitive on the key', () => {
    svc.setNextOutcome('dev-leak-001', 'FAIL')
    svc.setNextOutcome('DEV-CAMERA-001', 'PASS')
    expect(svc.peekNextOutcome('DEV-LEAK-001')).toBe('FAIL')
    expect(svc.peekNextOutcome('dev-camera-001')).toBe('PASS')
    svc.clearOverride('DEV-LEAK-001')
    expect(svc.peekNextOutcome('DEV-LEAK-001')).toBeNull()
    expect(svc.peekNextOutcome('DEV-CAMERA-001')).toBe('PASS')
  })
})
