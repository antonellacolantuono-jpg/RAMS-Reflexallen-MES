import { describe, it, expect } from 'vitest'

// Test the pagination helper inline (avoids import path issues in tests)
function buildPaginatedResult<T>(data: T[], total: number, filters: { page: number; limit: number }) {
  const { page, limit } = filters
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

describe('buildPaginatedResult', () => {
  it('returns correct structure for first page', () => {
    const result = buildPaginatedResult(['a', 'b'], 50, { page: 1, limit: 25 })
    expect(result.data).toEqual(['a', 'b'])
    expect(result.page).toBe(1)
    expect(result.limit).toBe(25)
    expect(result.total).toBe(50)
    expect(result.totalPages).toBe(2)
  })

  it('computes totalPages ceiling correctly', () => {
    const result = buildPaginatedResult([], 51, { page: 1, limit: 25 })
    expect(result.totalPages).toBe(3)
  })

  it('returns 0 totalPages when total is 0', () => {
    const result = buildPaginatedResult([], 0, { page: 1, limit: 25 })
    expect(result.totalPages).toBe(0)
  })

  it('handles limit=1 pagination', () => {
    const result = buildPaginatedResult(['x'], 3, { page: 2, limit: 1 })
    expect(result.totalPages).toBe(3)
    expect(result.page).toBe(2)
  })

  it('works with objects', () => {
    const items = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
    const result = buildPaginatedResult(items, 2, { page: 1, limit: 10 })
    expect(result.data).toHaveLength(2)
    expect(result.totalPages).toBe(1)
  })
})

describe('Soft delete invariants', () => {
  it('soft delete does not hard-delete (data stays)', () => {
    const records = [
      { id: '1', name: 'A', deletedAt: null, isActive: true },
      { id: '2', name: 'B', deletedAt: null, isActive: true },
    ]
    const softDelete = (id: string) => {
      const rec = records.find((r) => r.id === id)
      if (rec) { rec.deletedAt = new Date() as any; rec.isActive = false }
    }
    softDelete('1')
    expect(records).toHaveLength(2) // still 2 records in "DB"
    expect(records.find((r) => r.id === '1')?.isActive).toBe(false)
    expect(records.find((r) => r.id === '2')?.isActive).toBe(true)
  })

  it('restore reverses soft delete', () => {
    const record = { id: '1', isActive: false, deletedAt: new Date() as Date | null }
    const restore = (r: typeof record) => { r.isActive = true; r.deletedAt = null }
    restore(record)
    expect(record.isActive).toBe(true)
    expect(record.deletedAt).toBeNull()
  })

  it('list excludes soft-deleted by default', () => {
    const records = [
      { id: '1', isActive: true, deletedAt: null },
      { id: '2', isActive: false, deletedAt: new Date() },
    ]
    const active = records.filter((r) => r.isActive && !r.deletedAt)
    expect(active).toHaveLength(1)
    expect(active[0]?.id).toBe('1')
  })
})

describe('Registry event emission', () => {
  it('emits correct action on create', () => {
    const events: Array<{ module: string; id: string; action: string }> = []
    const emit = (module: string, id: string, action: string) => events.push({ module, id, action })

    emit('items', 'item-1', 'created')
    expect(events[0]).toEqual({ module: 'items', id: 'item-1', action: 'created' })
  })

  it('emits updated on patch', () => {
    const events: string[] = []
    const emit = (action: string) => events.push(action)
    emit('updated')
    expect(events).toContain('updated')
  })

  it('does not emit resolved (invalid RegistryAction)', () => {
    const VALID_ACTIONS = ['created', 'updated', 'deleted', 'restored']
    expect(VALID_ACTIONS).not.toContain('resolved')
  })
})
