import { describe, it, expect } from 'vitest'
import { PNE_WORKFLOW_V1 } from '../workflow-v1'

describe('PNE workflow v1 — Group B1 parallelism (PROMPT § 3.2)', () => {
  it('Group B1 supportsParallel + has device_main step DEV-LEAK-001 with 3 parallel children', () => {
    const phase2 = PNE_WORKFLOW_V1.phases[1]! // Phase 2 — Leak Test
    expect(phase2.name).toBe('Leak Test')

    const groupB1 = phase2.groups[0]!
    expect(groupB1.name).toContain('B1')
    expect(groupB1.supportsParallel).toBe(true)
    expect(groupB1.supportsRecovery).toBe(true)

    const stepsByDeviceCat = (cat: string) => groupB1.steps.filter((s) => s.deviceCategory === cat)
    const preSteps = stepsByDeviceCat('pre')
    const deviceMain = stepsByDeviceCat('device_main')
    const parallelSteps = stepsByDeviceCat('parallel')
    const postSteps = stepsByDeviceCat('post')

    expect(preSteps).toHaveLength(2) // STEP-LEAK-001 + 002
    expect(deviceMain).toHaveLength(1) // STEP-LEAK-003 RUN_LEAK_TEST
    expect(parallelSteps).toHaveLength(3) // STEP-LEAK-004 + 005 + 006
    expect(postSteps).toHaveLength(3) // STEP-LEAK-007 + 008 + 009

    // STEP-LEAK-003 is the device_main step
    const leakRun = deviceMain[0]!
    expect(leakRun.deviceCode).toBe('DEV-LEAK-001')
    expect(leakRun.recipeCode).toBe('RCP-LEAK-PNE-12-001')
    expect(leakRun.standardTimeSec).toBe(45)
    expect(leakRun.actionType).toBe('device_run')
    // S3 workaround: parallelStepsBufferSec encoded in instructions (no schema column)
    expect(leakRun.instructions).toContain('parallelStepsBufferSec: 5')

    // Parallel children have valid PartReference values
    const validPartRefs = ['current', 'previous', 'next', 'previous_n', 'batch', 'none']
    for (const p of parallelSteps) {
      expect(p.deviceCategory).toBe('parallel')
      expect(p.partReference).toBeDefined()
      expect(validPartRefs).toContain(p.partReference!)
    }

    // PROMPT § 3.2: 2.4 + 2.5 partRef='previous', 2.6 partRef='next'
    const refs = parallelSteps.map((p) => p.partReference)
    expect(refs.filter((r) => r === 'previous')).toHaveLength(2)
    expect(refs.filter((r) => r === 'next')).toHaveLength(1)
  })

  it('Phase 1 crimp steps (1.4 + 1.7) link DEV-CRIMP-001 + RCP-CRIMP-12-001', () => {
    const phase1 = PNE_WORKFLOW_V1.phases[0]!
    const groupA1 = phase1.groups[0]!
    const crimpSteps = groupA1.steps.filter((s) => s.actionType === 'device_run')
    expect(crimpSteps).toHaveLength(2) // crimp end A + crimp end B
    for (const s of crimpSteps) {
      expect(s.deviceCode).toBe('DEV-CRIMP-001')
      expect(s.recipeCode).toBe('RCP-CRIMP-12-001')
      expect(s.instructions).toContain('AP-CRIMP-FORCE')
    }
  })
})
