import { describe, it, expect } from 'vitest'
import {
  isStepCategoryAllowedInGroup,
  listAllowedStepCategories,
  mapPaletteCategoryToStepCategory,
} from './workflow-compatibility.rules'

describe('isStepCategoryAllowedInGroup', () => {
  it('returns true for the canonical MASTER_SPEC §7.6 combinations', () => {
    expect(isStepCategoryAllowedInGroup('skills_check', 'identification')).toBe(true)
    expect(isStepCategoryAllowedInGroup('bom_check', 'setup')).toBe(true)
    expect(isStepCategoryAllowedInGroup('device_execution', 'production')).toBe(true)
    expect(isStepCategoryAllowedInGroup('qc', 'quality_control')).toBe(true)
    expect(isStepCategoryAllowedInGroup('packaging', 'logistics')).toBe(true)
  })

  it('returns false when the step category is not in the allow-list for that group', () => {
    expect(isStepCategoryAllowedInGroup('assembly', 'quality_control')).toBe(false)
    expect(isStepCategoryAllowedInGroup('logistics', 'production')).toBe(false)
    expect(isStepCategoryAllowedInGroup('bom_check', 'logistics')).toBe(false)
    expect(isStepCategoryAllowedInGroup('qc', 'logistics')).toBe(false)
  })

  it('returns false for unknown group categories (defensive default)', () => {
    expect(isStepCategoryAllowedInGroup('unknown_group', 'production')).toBe(false)
    expect(isStepCategoryAllowedInGroup('', 'identification')).toBe(false)
  })
})

describe('listAllowedStepCategories', () => {
  it('returns the matrix row for a known group and an empty list for unknown', () => {
    expect(listAllowedStepCategories('device_execution')).toEqual([
      'production',
      'identification',
      'information',
    ])
    expect(listAllowedStepCategories('unknown_group')).toEqual([])
  })
})

describe('mapPaletteCategoryToStepCategory', () => {
  it('maps the 4 unambiguous palette ids 1:1 to schema StepCategory', () => {
    expect(mapPaletteCategoryToStepCategory('identification')).toBe('identification')
    expect(mapPaletteCategoryToStepCategory('production')).toBe('production')
    expect(mapPaletteCategoryToStepCategory('quality_control')).toBe('quality_control')
    expect(mapPaletteCategoryToStepCategory('logistics')).toBe('logistics')
    expect(mapPaletteCategoryToStepCategory('service')).toBe('setup')
    expect(mapPaletteCategoryToStepCategory('documentation')).toBe('information')
    expect(mapPaletteCategoryToStepCategory('safety')).toBeUndefined()
  })
})
