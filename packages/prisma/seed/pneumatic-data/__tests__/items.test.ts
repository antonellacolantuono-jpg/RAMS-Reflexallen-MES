import { describe, it, expect } from 'vitest'
import { PNE_ITEMS, PNE_BOX_TYPES } from '../items'

describe('PNE items + box types', () => {
  it('has 5 items + 1 box type with unique codes; FG uses lot tracking', () => {
    expect(PNE_ITEMS).toHaveLength(5)
    expect(PNE_BOX_TYPES).toHaveLength(1)

    const itemCodes = PNE_ITEMS.map((i) => i.code)
    expect(new Set(itemCodes).size).toBe(itemCodes.length)

    const fg = PNE_ITEMS.find((i) => i.code === 'PNE-TUBE-12-680')
    expect(fg).toBeDefined()
    expect(fg?.itemType).toBe('finished_good')
    expect(fg?.trackingMode).toBe('lot')

    const box = PNE_BOX_TYPES[0]
    expect(box?.code).toBe('BTYPE-PLT-RFA-001')
    expect(box?.isReturnable).toBe(true)
    expect(box?.maxUnitsCount).toBe(50)

    // Every item has the required shape
    for (const item of PNE_ITEMS) {
      expect(item.code).toMatch(/^[A-Z][A-Z0-9-]+$/)
      expect(item.name.length).toBeGreaterThan(5)
      expect(['finished_good', 'component', 'consumable', 'raw_material']).toContain(item.itemType)
      expect(['lot', 'serial', 'none']).toContain(item.trackingMode)
    }
  })
})
