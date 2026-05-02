import { describe, it, expect } from 'vitest'
import { PNE_CAUSE_CODES } from '../cause-codes'

describe('PNE cause codes', () => {
  it('has 6 codes per PROMPT § 3.2 with valid category + severity, all unique', () => {
    expect(PNE_CAUSE_CODES).toHaveLength(6)

    const codes = PNE_CAUSE_CODES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.sort()).toEqual([
      'camera_calibration',
      'crimp_leak',
      'material_defect',
      'other',
      'process_error',
      'tool_wear',
    ])

    // Severities map to PROMPT § 3.2
    const sevByCode = Object.fromEntries(PNE_CAUSE_CODES.map((c) => [c.code, c.severity]))
    expect(sevByCode.material_defect).toBe('high')
    expect(sevByCode.process_error).toBe('medium')
    expect(sevByCode.tool_wear).toBe('medium')
    expect(sevByCode.crimp_leak).toBe('high')
    expect(sevByCode.camera_calibration).toBe('medium')
    expect(sevByCode.other).toBe('variable')

    // Severity is encoded in description text per S1 workaround (no severity column)
    for (const c of PNE_CAUSE_CODES) {
      expect(c.description).toContain('Severity:')
      expect(c.description).toContain(c.severity)
      expect(['scrap', 'defect', 'downtime', 'rework']).toContain(c.category)
    }
  })
})
