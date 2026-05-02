import { describe, it, expect } from 'vitest'
import { PNE_WORK_ORDER } from '../work-orders'
import { PNE_OPERATORS } from '../operators'
import { PNE_ITEMS } from '../items'

describe('PNE work order WO-2026-PNE-0042', () => {
  it('matches PROMPT § 3.2: priority high, qtyTarget 100 + buffer 5 = 105, links resolve', () => {
    expect(PNE_WORK_ORDER.code).toBe('WO-2026-PNE-0042')
    expect(PNE_WORK_ORDER.qtyTarget).toBe(100)
    expect(PNE_WORK_ORDER.qtyBuffer).toBe(5)
    expect(PNE_WORK_ORDER.qtyTotal).toBe(105)
    expect(PNE_WORK_ORDER.qtyTarget + PNE_WORK_ORDER.qtyBuffer).toBe(PNE_WORK_ORDER.qtyTotal)

    expect(PNE_WORK_ORDER.priority).toBe('high')
    expect(PNE_WORK_ORDER.type).toBe('production')

    // Item link resolves
    const itemCodes = new Set(PNE_ITEMS.map((i) => i.code))
    expect(itemCodes.has(PNE_WORK_ORDER.itemCode)).toBe(true)
    expect(PNE_WORK_ORDER.itemCode).toBe('PNE-TUBE-12-680')

    // Assigned operator (Mario Rossi badge 1234) resolves
    const operatorBadges = new Set(PNE_OPERATORS.map((o) => o.badge))
    expect(operatorBadges.has(PNE_WORK_ORDER.assignedOperatorBadge)).toBe(true)
    expect(PNE_WORK_ORDER.assignedOperatorBadge).toBe('1234')

    // Buffer documented in notes since no qtyBuffer column on WorkOrder
    expect(PNE_WORK_ORDER.notes).toContain('100 + buffer 5')
    expect(PNE_WORK_ORDER.notes).toContain('105')
  })
})
