import { describe, it, expect } from 'vitest'
import { CreateItemSchema, UpdateItemSchema, ItemFiltersSchema } from './item.schema'

const validCuid = 'clh3z2k0v0000356kkxk8c0qa'

describe('CreateItemSchema', () => {
  it('accepts a minimal valid item', () => {
    const result = CreateItemSchema.safeParse({
      code: 'COMP-001',
      name: 'Raccordo T',
      itemType: 'component',
      plantId: validCuid,
    })
    expect(result.success).toBe(true)
  })

  it('applies default tracking mode and uom', () => {
    const result = CreateItemSchema.safeParse({
      code: 'FG-001',
      name: 'Tubo PA12',
      itemType: 'finished_good',
      plantId: validCuid,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trackingMode).toBe('lot')
      expect(result.data.uom).toBe('pc')
    }
  })

  it('rejects invalid itemType', () => {
    const result = CreateItemSchema.safeParse({
      code: 'X-001',
      name: 'Test',
      itemType: 'invalid_type',
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty code', () => {
    const result = CreateItemSchema.safeParse({
      code: '',
      name: 'Test',
      itemType: 'component',
      plantId: validCuid,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing plantId', () => {
    const result = CreateItemSchema.safeParse({
      code: 'X-001',
      name: 'Test',
      itemType: 'component',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional description', () => {
    const result = CreateItemSchema.safeParse({
      code: 'COMP-002',
      name: 'Valvola',
      itemType: 'component',
      plantId: validCuid,
      description: 'Valvola pneumatica DN25',
    })
    expect(result.success).toBe(true)
  })
})

describe('UpdateItemSchema', () => {
  it('accepts partial update', () => {
    const result = UpdateItemSchema.safeParse({ name: 'Nuovo nome' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid trackingMode', () => {
    const result = UpdateItemSchema.safeParse({ trackingMode: 'batch' })
    expect(result.success).toBe(false)
  })
})

describe('ItemFiltersSchema', () => {
  it('applies defaults', () => {
    const result = ItemFiltersSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(25)
      expect(result.data.isActive).toBe(true)
    }
  })

  it('coerces string page and limit', () => {
    const result = ItemFiltersSchema.safeParse({ page: '2', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(10)
    }
  })

  it('rejects limit over 100', () => {
    const result = ItemFiltersSchema.safeParse({ limit: 200 })
    expect(result.success).toBe(false)
  })
})
