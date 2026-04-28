import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryCache } from './index'

describe('MemoryCache', () => {
  let c: MemoryCache

  beforeEach(() => {
    c = new MemoryCache(300)
  })

  it('returns undefined for missing key', () => {
    expect(c.get('missing')).toBeUndefined()
  })

  it('stores and retrieves a value', () => {
    c.set('k', 'hello')
    expect(c.get('k')).toBe('hello')
  })

  it('stores objects by reference', () => {
    const obj = { a: 1 }
    c.set('obj', obj)
    expect(c.get('obj')).toBe(obj)
  })

  it('deletes a key', () => {
    c.set('k', 42)
    c.del('k')
    expect(c.get('k')).toBeUndefined()
  })

  it('clears all keys', () => {
    c.set('a', 1)
    c.set('b', 2)
    c.clear()
    expect(c.get('a')).toBeUndefined()
    expect(c.get('b')).toBeUndefined()
    expect(c.size()).toBe(0)
  })

  it('expires entry after TTL', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(now)        // set
      .mockReturnValueOnce(now + 2000) // get (after 2s, within 5s TTL)
      .mockReturnValueOnce(now + 6000) // get (after 6s, beyond 5s TTL)

    c.set('x', 'val', 5)
    expect(c.get('x')).toBe('val')
    expect(c.get('x')).toBeUndefined()

    vi.restoreAllMocks()
  })

  it('ttl=0 means no expiry', () => {
    c.set('forever', true, 0)
    expect(c.get('forever')).toBe(true)
  })

  it('reports size correctly', () => {
    expect(c.size()).toBe(0)
    c.set('a', 1)
    c.set('b', 2)
    expect(c.size()).toBe(2)
    c.del('a')
    expect(c.size()).toBe(1)
  })
})
