import { describe, it, expect } from 'vitest'
import { PNE_WORKFLOW_V0_CODE, PNE_WORKFLOW_V0_NAME } from '../workflow-v0-empty'
import { PNE_WORKFLOW_V1_CODE, PNE_WORKFLOW_V1_COUNTS } from '../workflow-v1'
import { PNE_ITEMS } from '../items'

describe('PNE workflow v0 (Empty) — scaffold for UX validation', () => {
  it('has distinct code from v1 but references the same FG item; v1 has body, v0 will not', () => {
    expect(PNE_WORKFLOW_V0_CODE).toBe('wf-pneumatic-air-680-v0')
    expect(PNE_WORKFLOW_V0_NAME).toContain('Empty')
    expect(PNE_WORKFLOW_V0_NAME).toContain('M12 680mm')

    // v0 and v1 are distinct workflows
    expect(PNE_WORKFLOW_V0_CODE).not.toBe(PNE_WORKFLOW_V1_CODE)

    // Both reference the same FG item (PNE-TUBE-12-680)
    const fg = PNE_ITEMS.find((i) => i.code === 'PNE-TUBE-12-680')
    expect(fg).toBeDefined()
    expect(fg?.itemType).toBe('finished_good')

    // v1 has body; v0 must NOT (verified at runtime by seed function via prisma.phase.count)
    expect(PNE_WORKFLOW_V1_COUNTS.phases).toBeGreaterThan(0)
    // PROMPT_PNE_SEED_CLEANUP (post F1 hotfix): v1 trimmed from 34 → 30 steps
    // (8 inline REC-* removed, 3 hidden recovery refs added, 1 STEP-CONFORMITY-001 added).
    expect(PNE_WORKFLOW_V1_COUNTS.steps).toBe(30)
  })
})
