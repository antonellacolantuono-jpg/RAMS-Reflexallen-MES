import { describe, it, expect } from 'vitest'
import {
  STEP_CATEGORIES,
  STEP_KINDS,
  getStepCategoryDescriptor,
  getStepKindDescriptor,
} from './workflow-palette.rules'

describe('STEP_CATEGORIES', () => {
  it('contains exactly 7 categories with stable ids in mockup order', () => {
    expect(STEP_CATEGORIES).toHaveLength(7)
    expect(STEP_CATEGORIES.map((c) => c.id)).toEqual([
      'identification',
      'production',
      'quality_control',
      'logistics',
      'service',
      'safety',
      'documentation',
    ])
  })
})

describe('STEP_KINDS', () => {
  it('contains exactly 5 kinds with stable ids in mockup order', () => {
    expect(STEP_KINDS).toHaveLength(5)
    expect(STEP_KINDS.map((k) => k.id)).toEqual([
      'manual',
      'automatic',
      'guided',
      'parallel',
      'sub_flow',
    ])
  })
})

describe('palette descriptors', () => {
  it('every category and kind has non-empty Italian labels and a lucide icon name (PascalCase)', () => {
    for (const cat of STEP_CATEGORIES) {
      expect(cat.labelIt).toMatch(/\S/)
      expect(cat.descriptionIt).toMatch(/\S/)
      expect(cat.iconName).toMatch(/^[A-Z][A-Za-z]+$/)
    }
    for (const kind of STEP_KINDS) {
      expect(kind.labelIt).toMatch(/\S/)
      expect(kind.descriptionIt).toMatch(/\S/)
      expect(kind.iconName).toMatch(/^[A-Z][A-Za-z]+$/)
    }
  })
})

describe('descriptor lookups', () => {
  it('return the matching descriptor for known ids and undefined otherwise', () => {
    expect(getStepCategoryDescriptor('production')?.iconName).toBe('Cog')
    expect(getStepCategoryDescriptor('safety')?.labelIt).toBe('Sicurezza')
    expect(getStepCategoryDescriptor('nonexistent')).toBeUndefined()

    expect(getStepKindDescriptor('parallel')?.iconName).toBe('Pause')
    expect(getStepKindDescriptor('sub_flow')?.labelIt).toBe('Sotto-flusso')
    expect(getStepKindDescriptor('nonexistent')).toBeUndefined()
  })
})
