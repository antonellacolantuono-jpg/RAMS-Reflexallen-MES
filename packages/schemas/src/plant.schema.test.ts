import { describe, it, expect } from 'vitest'
import { CreatePlantSchema, UpdatePlantSchema } from './plant.schema'

describe('CreatePlantSchema', () => {
  it('accepts a valid plant', () => {
    const result = CreatePlantSchema.safeParse({
      code: 'PLANT01',
      name: 'Main Plant',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty code', () => {
    const result = CreatePlantSchema.safeParse({
      code: '',
      name: 'Main Plant',
    })
    expect(result.success).toBe(false)
  })

  it('uppercases the code', () => {
    const result = CreatePlantSchema.safeParse({
      code: 'plant01',
      name: 'Main Plant',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('PLANT01')
    }
  })

  it('rejects a missing name', () => {
    const result = CreatePlantSchema.safeParse({
      code: 'PLANT01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = CreatePlantSchema.safeParse({
      code: 'PLANT01',
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('applies default timezone and locale', () => {
    const result = CreatePlantSchema.safeParse({
      code: 'PLANT01',
      name: 'Main Plant',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.timezone).toBe('Europe/Rome')
      expect(result.data.locale).toBe('it-IT')
    }
  })
})

describe('UpdatePlantSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = UpdatePlantSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a partial update with only name', () => {
    const result = UpdatePlantSchema.safeParse({ name: 'Updated Plant' })
    expect(result.success).toBe(true)
  })

  it('still uppercases code in partial update', () => {
    const result = UpdatePlantSchema.safeParse({ code: 'abc' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('ABC')
    }
  })
})
