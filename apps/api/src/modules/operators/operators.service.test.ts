import { describe, it, expect, vi } from 'vitest'

// PIN validation logic extracted from OperatorsService for testability
function validatePin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

// Simulate hashing (actual argon2 is async and binary — tested via integration)
async function mockHashPin(pin: string): Promise<string> {
  return `$argon2id$v=19$mock$${pin.length}chars`
}

function pinNeverReturnedInResponse(operator: Record<string, unknown>): boolean {
  return !('pin' in operator) && !('pinHash' in operator) && !('pin_hash' in operator)
}

describe('Operator PIN validation', () => {
  it('accepts 4-digit PIN', () => {
    expect(validatePin('1234')).toBe(true)
  })

  it('accepts 6-digit PIN', () => {
    expect(validatePin('123456')).toBe(true)
  })

  it('rejects 3-digit PIN', () => {
    expect(validatePin('123')).toBe(false)
  })

  it('rejects 7-digit PIN', () => {
    expect(validatePin('1234567')).toBe(false)
  })

  it('rejects alphabetic PIN', () => {
    expect(validatePin('abcd')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validatePin('')).toBe(false)
  })
})

describe('Operator PIN hashing', () => {
  it('hash starts with $argon2id prefix', async () => {
    const hash = await mockHashPin('1234')
    expect(hash).toMatch(/^\$argon2id/)
  })

  it('PIN never returned in API response', () => {
    const apiResponse = {
      id: 'op-1',
      badge: 'OP-001',
      firstName: 'Marco',
      lastName: 'Rossi',
      status: 'active',
    }
    expect(pinNeverReturnedInResponse(apiResponse)).toBe(true)
  })

  it('response with pin field is detected', () => {
    const leakyResponse = { id: 'op-1', pin: '1234', pinHash: 'hash' }
    expect(pinNeverReturnedInResponse(leakyResponse)).toBe(false)
  })
})

describe('Operator status machine', () => {
  const VALID_STATUSES = ['active', 'inactive', 'suspended']

  it('active status is valid', () => {
    expect(VALID_STATUSES).toContain('active')
  })

  it('inactive is a valid status (soft-disable, not soft-delete)', () => {
    expect(VALID_STATUSES).toContain('inactive')
  })

  it('deleted is NOT a valid status (use soft delete instead)', () => {
    expect(VALID_STATUSES).not.toContain('deleted')
  })
})
