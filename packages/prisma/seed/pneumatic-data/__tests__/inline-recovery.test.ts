import { describe, it, expect } from 'vitest'
import { PNE_WORKFLOW_V1 } from '../workflow-v1'

// PROMPT_PNE_SEED_CLEANUP (post F1 hotfix, 2026-05-03):
// Inline REC-* recovery sub-flow steps were removed. Recovery is now driven
// at runtime by the HMI RecoveryFlow inline panel (D5, hardcoded
// MAX_RECOVERY_ATTEMPTS=2) on step.status === 'blocked'. Groups B2 + C2 now
// hold ONLY hidden ref steps used as preRetryStepIds candidates from the
// workflow editor's recoveryConfig section (D4.1 Automatic action form).
// HMI page.tsx filters Recovery groups from the linear operator flow via
// /Recovery/i name match.
//
// Pre-retry execution at runtime + recoveryConfig persistence on Step.data
// are deferred to PROMPT_7 (TODO-040 extended).
describe('PNE workflow v1 — recovery refs groups (post-cleanup)', () => {
  it('B2 + C2 are recovery-refs groups with no inline REC-* steps', () => {
    // Phase 2 — Leak Test → 2 groups: B1 main + B2 recovery refs
    const phase2 = PNE_WORKFLOW_V1.phases[1]!
    expect(phase2.groups).toHaveLength(2)

    const groupB2 = phase2.groups[1]!
    expect(groupB2.name).toContain('B2')
    expect(groupB2.name).toMatch(/Recovery/i)
    expect(groupB2.name).toContain('refs')
    expect(groupB2.supportsRecovery).toBe(true)
    // 2 hidden refs only (no diagnosis / attempt / scrap step)
    expect(groupB2.steps).toHaveLength(2)

    const leakRefNames = groupB2.steps.map((s) => s.name)
    expect(leakRefNames[0]).toContain('STEP-LEAK-RECOVERY-CHECK')
    expect(leakRefNames[1]).toContain('STEP-LEAK-RECOVERY-CLEAN')

    // Phase 3 — Camera Test → 3 groups: C1 main + C2 refs + C3 conformity
    const phase3 = PNE_WORKFLOW_V1.phases[2]!
    expect(phase3.groups).toHaveLength(3)

    const groupC2 = phase3.groups[1]!
    expect(groupC2.name).toContain('C2')
    expect(groupC2.name).toMatch(/Recovery/i)
    expect(groupC2.name).toContain('refs')
    expect(groupC2.supportsRecovery).toBe(true)
    expect(groupC2.steps).toHaveLength(1)
    expect(groupC2.steps[0]!.name).toContain('STEP-CAM-RECOVERY-CLEAN')

    // Recovery groups always have order=2 (after main group order=1)
    expect(groupB2.order).toBe(2)
    expect(groupC2.order).toBe(2)
  })

  it('all recovery-refs steps use category=recovery (signals "hidden ref")', () => {
    const refSteps: { name: string; category: string }[] = []
    for (const p of PNE_WORKFLOW_V1.phases) {
      for (const g of p.groups) {
        if (!g.name.match(/Recovery/i)) continue
        for (const s of g.steps) refSteps.push({ name: s.name, category: s.category })
      }
    }
    expect(refSteps).toHaveLength(3)
    for (const s of refSteps) {
      expect(s.category).toBe('recovery')
    }
  })

  it('zero inline REC-* steps remain anywhere in the workflow', () => {
    const allStepNames: string[] = []
    for (const p of PNE_WORKFLOW_V1.phases) {
      for (const g of p.groups) {
        for (const s of g.steps) allStepNames.push(s.name)
      }
    }
    // The pre-cleanup seed had 8 inline REC-LEAK-DIAG/ATT-1/ATT-2/SCRAP +
    // REC-CAM-DIAG/ATT-1/ATT-2/SCRAP. Verify they are gone.
    const inlineRecPatterns = [
      /\[REC-LEAK-DIAG\]/,
      /\[REC-LEAK-ATT-1\]/,
      /\[REC-LEAK-ATT-2\]/,
      /\[REC-LEAK-SCRAP\]/,
      /\[REC-CAM-DIAG\]/,
      /\[REC-CAM-ATT-1\]/,
      /\[REC-CAM-ATT-2\]/,
      /\[REC-CAM-SCRAP\]/,
    ]
    for (const pattern of inlineRecPatterns) {
      expect(allStepNames.some((n) => pattern.test(n))).toBe(false)
    }
  })

  it('decision steps reference HMI RecoveryFlow (not inline B2/C2 sub-flow)', () => {
    const phase2Main = PNE_WORKFLOW_V1.phases[1]!.groups[0]!
    const leakDecision = phase2Main.steps.find((s) => s.category === 'decision')
    expect(leakDecision?.instructions).toMatch(/RecoveryFlow/i)
    expect(leakDecision?.instructions).not.toContain('inline recovery group B2')

    const phase3Main = PNE_WORKFLOW_V1.phases[2]!.groups[0]!
    const camDecision = phase3Main.steps.find((s) => s.category === 'decision')
    expect(camDecision?.instructions).toMatch(/RecoveryFlow/i)
    expect(camDecision?.instructions).not.toContain('inline recovery group C2')
  })

  // TODO-061 closure (2026-05-06) — recoveryConfig populated on STEP-LEAK-003 +
  // camera test cycle. preRetryStepCodes resolved to cuids by seedWorkflowV1's
  // second pass; in-memory assertions verify the constant shape (the resolution
  // step is exercised by the seed run itself).
  it('STEP-LEAK-003 has recoveryConfig pointing to LEAK recovery refs', () => {
    const phase2 = PNE_WORKFLOW_V1.phases[1]!
    const groupB1 = phase2.groups[0]!
    const leakStep = groupB1.steps.find((s) => s.name.includes('STEP-LEAK-003'))!
    expect(leakStep.recoveryConfig).toBeDefined()
    expect(leakStep.recoveryConfig!.enabled).toBe(true)
    expect(leakStep.recoveryConfig!.maxAttempts).toBe(2)
    expect(leakStep.recoveryConfig!.preRetryStepCodes).toEqual([
      'STEP-LEAK-RECOVERY-CHECK',
      'STEP-LEAK-RECOVERY-CLEAN',
    ])

    // Verify referenced ref steps actually exist in B2 (resolution sanity check)
    const groupB2 = phase2.groups[1]!
    const refCodes = groupB2.steps.map((s) => {
      const m = s.name.match(/^\[([^\]]+)\]/)
      return m ? m[1] : s.name
    })
    for (const code of leakStep.recoveryConfig!.preRetryStepCodes) {
      expect(refCodes).toContain(code)
    }
  })

  it('camera test cycle has recoveryConfig pointing to CAM recovery ref', () => {
    const phase3 = PNE_WORKFLOW_V1.phases[2]!
    const groupC1 = phase3.groups[0]!
    const camStep = groupC1.steps.find((s) => s.name.includes('Camera test cycle'))!
    expect(camStep.recoveryConfig).toBeDefined()
    expect(camStep.recoveryConfig!.enabled).toBe(true)
    expect(camStep.recoveryConfig!.maxAttempts).toBe(2)
    expect(camStep.recoveryConfig!.preRetryStepCodes).toEqual(['STEP-CAM-RECOVERY-CLEAN'])

    // Verify referenced ref step actually exists in C2
    const groupC2 = phase3.groups[1]!
    const refCodes = groupC2.steps.map((s) => {
      const m = s.name.match(/^\[([^\]]+)\]/)
      return m ? m[1] : s.name
    })
    for (const code of camStep.recoveryConfig!.preRetryStepCodes) {
      expect(refCodes).toContain(code)
    }
  })

  it('C3 — Conformity Check group has STEP-CONFORMITY-001 as binary manual_choice', () => {
    const phase3 = PNE_WORKFLOW_V1.phases[2]!
    const groupC3 = phase3.groups[2]!
    expect(groupC3.name).toContain('C3')
    expect(groupC3.name).toContain('Conformity Check')
    expect(groupC3.name).not.toMatch(/Recovery/i) // must NOT be filtered out by HMI
    expect(groupC3.supportsRecovery).toBe(false)
    expect(groupC3.steps).toHaveLength(1)

    const step = groupC3.steps[0]!
    expect(step.name).toContain('STEP-CONFORMITY-001')
    expect(step.category).toBe('decision')
    expect(step.actionType).toBe('manual_choice')
    // Instructions describe the binary choice + scrap default cause
    expect(step.instructions).toContain('Conforme')
    expect(step.instructions).toContain('Non conforme')
    expect(step.instructions).toContain('HMIScrapForm')
  })
})
