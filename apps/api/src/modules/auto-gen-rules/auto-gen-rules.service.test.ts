import { describe, it, expect } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { AutoGenRulesService } from './auto-gen-rules.service'

describe('AutoGenRulesService', () => {
  const service = new AutoGenRulesService()

  it('returns exactly 7 rules', () => {
    const rules = service.findAll()
    expect(rules).toHaveLength(7)
  })

  it('every rule has required fields', () => {
    const rules = service.findAll()
    for (const rule of rules) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.trigger).toBeTruthy()
      expect(rule.scope).toBeTruthy()
      expect(rule.description).toBeTruthy()
    }
  })

  it('rule ids are unique', () => {
    const rules = service.findAll()
    const ids = rules.map((r) => r.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('findById returns correct rule by id', () => {
    const rules = service.findAll()
    const first = rules[0]
    if (!first) return
    const found = service.findById(first.id)
    expect(found).toEqual(first)
  })

  it('findById throws NotFoundException for unknown id', () => {
    expect(() => service.findById('not-a-real-id')).toThrow(NotFoundException)
  })

  it('rule triggers cover key MES events', () => {
    const rules = service.findAll()
    const triggers = rules.map((r) => r.trigger)
    const hasLotOrWoTrigger = triggers.some(
      (t) => t.includes('work_order') || t.includes('lot'),
    )
    expect(hasLotOrWoTrigger).toBe(true)
  })

  it('all rules have non-empty description', () => {
    const rules = service.findAll()
    expect(rules.every((r) => r.description.length > 10)).toBe(true)
  })
})
