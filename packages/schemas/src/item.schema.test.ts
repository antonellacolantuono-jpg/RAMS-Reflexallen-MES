import { describe, it, expect } from 'vitest'
import { CreateItemSchema } from './item.schema'
import { CreateWorkOrderSchema } from './work-order.schema'
import { ItemType, TrackingMode, UnitOfMeasure } from '@mes/types'

const validCuid = 'clh3z2k0v0000356kkxk8c0qa'

describe('CreateItemSchema', () => {
  it('accepts a valid item', () => {
    const result = CreateItemSchema.safeParse({
      code: 'PART001',
      name: 'Widget A',
      itemType: ItemType.COMPONENT,
      plantId: validCuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid itemType', () => {
    const result = CreateItemSchema.safeParse({
      code: 'PART001',
      name: 'Widget A',
      itemType: 'invalid_type',
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown uom', () => {
    const result = CreateItemSchema.safeParse({
      code: 'PART001',
      name: 'Widget A',
      itemType: ItemType.COMPONENT,
      uom: 'lightyear',
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })

  it('uppercases the code', () => {
    const result = CreateItemSchema.safeParse({
      code: 'part001',
      name: 'Widget A',
      itemType: ItemType.RAW_MATERIAL,
      plantId: validCuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('PART001')
    }
  })

  it('applies default trackingMode and uom', () => {
    const result = CreateItemSchema.safeParse({
      code: 'PART002',
      name: 'Widget B',
      itemType: ItemType.FINISHED_GOOD,
      plantId: validCuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trackingMode).toBe(TrackingMode.LOT)
      expect(result.data.uom).toBe(UnitOfMeasure.PC)
    }
  })

  it('rejects an empty code', () => {
    const result = CreateItemSchema.safeParse({
      code: '',
      name: 'Widget A',
      itemType: ItemType.COMPONENT,
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateWorkOrderSchema — qtyTarget', () => {
  it('rejects a non-positive qtyTarget', () => {
    const result = CreateWorkOrderSchema.safeParse({
      itemId: validCuid,
      qtyTarget: 0,
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative qtyTarget', () => {
    const result = CreateWorkOrderSchema.safeParse({
      itemId: validCuid,
      qtyTarget: -5,
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })

  it('accepts a positive qtyTarget', () => {
    const result = CreateWorkOrderSchema.safeParse({
      itemId: validCuid,
      qtyTarget: 100,
      plantId: validCuid,
    })
    expect(result.success).toBe(true)
  })
})
