export interface CacheOptions {
  ttl?: number
}

interface CacheEntry<T> {
  value: T
  expiresAt: number | null
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private defaultTtl: number

  constructor(defaultTtlSec = 300) {
    this.defaultTtl = defaultTtlSec
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set<T>(key: string, value: T, ttlSec?: number): void {
    const ttl = ttlSec ?? this.defaultTtl
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null
    this.store.set(key, { value, expiresAt })
  }

  del(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }
}

export const cache = new MemoryCache(
  parseInt(process.env['CACHE_TTL_DEFAULT'] ?? '300', 10),
)

export default cache
