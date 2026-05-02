import { describe, it, expect } from 'vitest'
import { PNE_ATTENTION_POINTS } from '../attention-points'

describe('PNE attention points', () => {
  it('has 3 APs with valid severity rank + unique codes per PROMPT § 3.2', () => {
    expect(PNE_ATTENTION_POINTS).toHaveLength(3)

    const codes = PNE_ATTENTION_POINTS.map((a) => a.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.sort()).toEqual(['AP-CRIMP-FORCE', 'AP-LABEL-LEGIBILITY', 'AP-LEAK-PRESSURE'])

    // Severity mapping (PROMPT high → critical, medium → warning, low → info)
    const validSeverities: ReadonlyArray<string> = ['critical', 'warning', 'info']
    const bySev = Object.fromEntries(PNE_ATTENTION_POINTS.map((a) => [a.code, a.severity]))
    expect(bySev['AP-CRIMP-FORCE']).toBe('critical')
    expect(bySev['AP-LEAK-PRESSURE']).toBe('critical')
    expect(bySev['AP-LABEL-LEGIBILITY']).toBe('warning')

    for (const ap of PNE_ATTENTION_POINTS) {
      expect(validSeverities).toContain(ap.severity)
      expect(['process', 'safety', 'quality']).toContain(ap.category)
      expect(ap.entityType).toBe('Step')
      expect(ap.entityIdPlaceholder).toMatch(/^STEP-/)
      expect(ap.promptMessage.length).toBeGreaterThan(20)
    }
  })
})
