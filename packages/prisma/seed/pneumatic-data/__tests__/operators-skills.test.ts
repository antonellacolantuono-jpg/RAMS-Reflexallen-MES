import { describe, it, expect } from 'vitest'
import { PNE_OPERATORS } from '../operators'
import { PNE_SKILLS } from '../skills'

describe('PNE operators × skills', () => {
  it('seeds Mario Rossi (1234) with 4 skills and Anna Verdi (5678) with 2 skills', () => {
    expect(PNE_OPERATORS).toHaveLength(2)

    const badges = PNE_OPERATORS.map((o) => o.badge)
    expect(new Set(badges).size).toBe(badges.length)
    expect(badges.sort()).toEqual(['1234', '5678'])

    const mario = PNE_OPERATORS.find((o) => o.badge === '1234')!
    expect(mario.firstName).toBe('Mario')
    expect(mario.lastName).toBe('Rossi')
    expect(mario.pin).toBe('1234')
    expect(mario.skillCodes).toHaveLength(4)
    expect(new Set(mario.skillCodes)).toEqual(
      new Set(['ASSY', 'TEST', 'QC', 'IDENTIFICATION']),
    )

    const anna = PNE_OPERATORS.find((o) => o.badge === '5678')!
    expect(anna.firstName).toBe('Anna')
    expect(anna.lastName).toBe('Verdi')
    expect(anna.pin).toBe('5678')
    expect(anna.skillCodes).toHaveLength(2)
    expect(new Set(anna.skillCodes)).toEqual(new Set(['TEST', 'QC']))

    // Every operator's skill codes resolve against the seeded skill catalog
    const skillCodes = new Set(PNE_SKILLS.map((s) => s.code))
    for (const op of PNE_OPERATORS) {
      for (const sc of op.skillCodes) {
        expect(skillCodes.has(sc)).toBe(true)
      }
    }
  })
})
