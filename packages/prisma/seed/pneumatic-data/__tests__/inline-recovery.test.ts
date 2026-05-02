import { describe, it, expect } from 'vitest'
import { PNE_WORKFLOW_V1 } from '../workflow-v1'

describe('PNE workflow v1 — inline recovery groups (S2 workaround)', () => {
  it('Group B2 (leak recovery) and C2 (camera recovery) are inline with 4 steps each', () => {
    // Phase 2 — Leak Test → 2 groups: B1 main + B2 recovery
    const phase2 = PNE_WORKFLOW_V1.phases[1]!
    expect(phase2.groups).toHaveLength(2)
    const groupB2 = phase2.groups[1]!
    expect(groupB2.name).toContain('B2')
    expect(groupB2.name).toContain('Recovery')
    expect(groupB2.supportsRecovery).toBe(true)
    expect(groupB2.steps).toHaveLength(4)

    // Recovery flow shape: diagnosis → attempt 1 → attempt 2 → scrap
    const stepNames = groupB2.steps.map((s) => s.name)
    expect(stepNames[0]).toContain('Diagnosis')
    expect(stepNames[1]).toContain('First retry')
    expect(stepNames[2]).toContain('Second retry')
    expect(stepNames[3]).toContain('scrap')
    // First step is decision (operator selects fault code)
    expect(groupB2.steps[0]?.category).toBe('decision')
    expect(groupB2.steps[0]?.actionType).toBe('manual_choice')
    // Diagnosis instructions reference LK-* fault codes per S1 workaround
    expect(groupB2.steps[0]?.instructions).toContain('LK-')
    // Final step is document_defect
    expect(groupB2.steps[3]?.actionType).toBe('document_defect')

    // Phase 3 — Camera Test → 2 groups: C1 main + C2 recovery
    const phase3 = PNE_WORKFLOW_V1.phases[2]!
    expect(phase3.groups).toHaveLength(2)
    const groupC2 = phase3.groups[1]!
    expect(groupC2.name).toContain('C2')
    expect(groupC2.name).toContain('Recovery')
    expect(groupC2.supportsRecovery).toBe(true)
    expect(groupC2.steps).toHaveLength(4)
    // Diagnosis instructions reference CM-* fault codes per S1 workaround
    expect(groupC2.steps[0]?.instructions).toContain('CM-')

    // Recovery groups always have order=2 (after main group order=1)
    expect(groupB2.order).toBe(2)
    expect(groupC2.order).toBe(2)

    // Decision steps in main groups B1 / C1 reference the inline recovery via instructions (S2 workaround)
    const phase2Main = phase2.groups[0]!
    const leakDecision = phase2Main.steps.find((s) => s.category === 'decision')
    expect(leakDecision?.instructions).toContain('B2')

    const phase3Main = phase3.groups[0]!
    const camDecision = phase3Main.steps.find((s) => s.category === 'decision')
    expect(camDecision?.instructions).toContain('C2')
  })
})
