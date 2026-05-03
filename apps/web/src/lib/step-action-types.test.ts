import { describe, it, expect } from 'vitest'
import {
  getActionTypesForCategory,
  getActionTypeDescriptor,
  ACTION_TYPES_BY_CATEGORY,
} from './step-action-types'

describe('step-action-types catalog', () => {
  it('filters action types by category', () => {
    const production = getActionTypesForCategory('production')
    expect(production.map((a) => a.id)).toEqual([
      'assembly',
      'process',
      'device_run',
      'rework',
    ])

    const identification = getActionTypesForCategory('identification')
    expect(identification.map((a) => a.id)).toContain('apply_label')
    expect(identification.map((a) => a.id)).toContain('print_label')
    expect(identification.every((a) => a.category === 'identification')).toBe(true)

    expect(getActionTypesForCategory('nonexistent_category')).toEqual([])
  })

  it('looks up an action type descriptor across all categories', () => {
    const desc = getActionTypeDescriptor('apply_label')
    expect(desc).toBeDefined()
    expect(desc?.labelIt).toBe('Applica etichetta')
    expect(desc?.category).toBe('identification')

    expect(getActionTypeDescriptor('not_a_real_action')).toBeUndefined()
  })

  it('covers every documented MASTER_SPECIFICATION § 4.5 category bucket', () => {
    expect(Object.keys(ACTION_TYPES_BY_CATEGORY).sort()).toEqual(
      [
        'production',
        'logistics',
        'identification',
        'quality_control',
        'decision',
        'information',
        'setup',
        'teardown',
        'box',
      ].sort(),
    )
  })
})
