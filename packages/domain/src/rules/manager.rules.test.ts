import { describe, it, expect } from 'vitest'
import { canReleaseWorkOrder, MANAGER_SKILL_CODE } from './manager.rules'

describe('canReleaseWorkOrder', () => {
  it('returns true when MANAGER skill code is present', () => {
    expect(canReleaseWorkOrder(['MANAGER'])).toBe(true)
    expect(canReleaseWorkOrder(['EXT', 'MANAGER', 'QC'])).toBe(true)
    expect(canReleaseWorkOrder([MANAGER_SKILL_CODE])).toBe(true)
  })

  it('returns false when MANAGER skill code is absent', () => {
    expect(canReleaseWorkOrder([])).toBe(false)
    expect(canReleaseWorkOrder(['EXT'])).toBe(false)
    expect(canReleaseWorkOrder(['EXT', 'QC', 'TEST', 'PACK'])).toBe(false)
  })

  it('treats MANAGER matching as exact (case-sensitive)', () => {
    expect(canReleaseWorkOrder(['manager'])).toBe(false)
    expect(canReleaseWorkOrder(['Manager'])).toBe(false)
  })
})
