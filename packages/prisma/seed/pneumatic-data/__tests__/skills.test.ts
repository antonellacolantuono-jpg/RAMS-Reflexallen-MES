import { describe, it, expect } from 'vitest'
import { PNE_SKILLS } from '../skills'

describe('PNE skills', () => {
  it('contains 4 skills, only IDENTIFICATION is net-new (3 baseline-shared)', () => {
    expect(PNE_SKILLS).toHaveLength(4)

    const codes = PNE_SKILLS.map((s) => s.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.sort()).toEqual(['ASSY', 'IDENTIFICATION', 'QC', 'TEST'])

    const newSkills = PNE_SKILLS.filter((s) => s.netNew)
    expect(newSkills).toHaveLength(1)
    expect(newSkills[0]?.code).toBe('IDENTIFICATION')

    const sharedSkills = PNE_SKILLS.filter((s) => !s.netNew)
    expect(sharedSkills).toHaveLength(3)
    expect(sharedSkills.map((s) => s.code).sort()).toEqual(['ASSY', 'QC', 'TEST'])

    // Every skill has the required shape
    for (const s of PNE_SKILLS) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(['production', 'quality', 'logistics', 'leadership']).toContain(s.category)
    }
  })
})
