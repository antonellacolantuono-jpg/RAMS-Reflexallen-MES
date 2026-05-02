import { describe, it, expect } from 'vitest'
import { PNE_FAULT_CODES } from '../fault-codes'

describe('PNE fault codes (CauseCode workaround per S1)', () => {
  it('has 5 LK-* leak + 5 CM-* camera = 10 codes, all unique with consistent phase encoding', () => {
    expect(PNE_FAULT_CODES).toHaveLength(10)

    const codes = PNE_FAULT_CODES.map((f) => f.code)
    expect(new Set(codes).size).toBe(codes.length)

    const leakCodes = PNE_FAULT_CODES.filter((f) => f.phase === 'leak')
    const cameraCodes = PNE_FAULT_CODES.filter((f) => f.phase === 'camera')
    expect(leakCodes).toHaveLength(5)
    expect(cameraCodes).toHaveLength(5)

    // Code prefix must redundantly encode phase scope (HMI Recovery dropdowns)
    for (const f of leakCodes) expect(f.code.startsWith('LK-')).toBe(true)
    for (const f of cameraCodes) expect(f.code.startsWith('CM-')).toBe(true)

    // Severity encoded in description text per S1 (no severity column on CauseCode)
    const validSeverities = ['low', 'medium', 'high']
    for (const f of PNE_FAULT_CODES) {
      expect(validSeverities).toContain(f.severity)
      expect(f.description).toContain('Severity:')
      expect(f.description).toContain(f.severity)
      expect(f.description).toContain('Suggested action')
    }

    // PROMPT § 3.2 spot-checks
    const byCode = Object.fromEntries(PNE_FAULT_CODES.map((f) => [f.code, f]))
    expect(byCode['LK-HOSE-LOOSE']?.severity).toBe('medium')
    expect(byCode['LK-REAL-DEFECT']?.severity).toBe('high')
    expect(byCode['LK-CRIMP-LEAK']?.severity).toBe('high')
    expect(byCode['CM-MISALIGN']?.severity).toBe('medium')
    expect(byCode['CM-REAL-DEFECT']?.severity).toBe('high')
  })
})
