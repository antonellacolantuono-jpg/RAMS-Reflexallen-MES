import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin } from './pin-hash.util'

describe('pin-hash util', () => {
  it('hashes a PIN with argon2id prefix', async () => {
    const hash = await hashPin('1234')
    expect(hash).toMatch(/^\$argon2id\$/)
  })

  it('verifies the same PIN against its hash', async () => {
    const hash = await hashPin('5678')
    expect(await verifyPin(hash, '5678')).toBe(true)
  })

  it('rejects a different PIN against the same hash', async () => {
    const hash = await hashPin('1234')
    expect(await verifyPin(hash, '9999')).toBe(false)
  })

  it('produces a different hash for the same PIN each time (random salt)', async () => {
    const a = await hashPin('1111')
    const b = await hashPin('1111')
    expect(a).not.toBe(b)
  })

  it('returns false when the hash is malformed instead of throwing', async () => {
    const result = await verifyPin('not-a-hash', '1234')
    expect(result).toBe(false)
  })
})
