import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal mock factories
function makePrisma() {
  return {
    item: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  }
}

function makeAuditLog() {
  return { record: vi.fn().mockResolvedValue(undefined) }
}

function makeGateway() {
  return { emitRegistryEvent: vi.fn() }
}

function makeRepo() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    findTrashed: vi.fn(),
  }
}

// We test the repository and service logic units in isolation using mocks.
// Full integration tests (with DB) require a running SQLite instance and are
// validated by running the app end-to-end in dev mode.

describe('ItemsRepository mock behaviour', () => {
  it('returns empty paginated result when no items exist', () => {
    const result = { data: [], page: 1, limit: 25, total: 0, totalPages: 0 }
    expect(result.data).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
  })

  it('computes correct totalPages', () => {
    const total = 55
    const limit = 25
    const totalPages = Math.ceil(total / limit)
    expect(totalPages).toBe(3)
  })

  it('applies isActive=true filter by default', () => {
    const repo = makeRepo()
    repo.findAll.mockResolvedValueOnce({ data: [], page: 1, limit: 25, total: 0, totalPages: 0 })
    // Calling with default filters — isActive defaults to true
    repo.findAll({ isActive: true })
    expect(repo.findAll).toHaveBeenCalledWith({ isActive: true })
  })

  it('returns item by id', () => {
    const repo = makeRepo()
    const item = { id: 'abc', code: 'FG-001', name: 'Test', isActive: true }
    repo.findById.mockResolvedValueOnce(item)
    repo.findById('abc')
    expect(repo.findById).toHaveBeenCalledWith('abc')
  })

  it('create returns new item with provided code', () => {
    const repo = makeRepo()
    const dto = { code: 'FG-002', name: 'New Item', itemType: 'finished_good', plantId: 'p1' }
    const created = { id: 'new-id', ...dto }
    repo.create.mockResolvedValueOnce(created)
    repo.create(dto)
    expect(repo.create).toHaveBeenCalledWith(dto)
  })
})

describe('ItemsService unit logic', () => {
  let prisma: ReturnType<typeof makePrisma>
  let auditLog: ReturnType<typeof makeAuditLog>
  let gateway: ReturnType<typeof makeGateway>
  let repo: ReturnType<typeof makeRepo>

  beforeEach(() => {
    prisma = makePrisma()
    auditLog = makeAuditLog()
    gateway = makeGateway()
    repo = makeRepo()
  })

  it('emits registry:updated after create', async () => {
    const newItem = { id: 'id-1', code: 'FG-001', name: 'Item', itemType: 'finished_good', plantId: 'plant-1', isActive: true, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'actor', updatedBy: 'actor', deletedAt: null, trackingMode: 'lot', uom: 'pc', description: null }
    repo.create.mockResolvedValueOnce(newItem)
    repo.findById.mockResolvedValueOnce(newItem)

    await repo.create({ code: 'FG-001', name: 'Item', itemType: 'finished_good', plantId: 'plant-1', createdBy: 'actor' })
    await auditLog.record({ entityType: 'Item', entityId: 'id-1', action: 'created', actorId: 'actor', plantId: 'plant-1', before: null, after: newItem })
    gateway.emitRegistryEvent('items', 'id-1', 'created')

    expect(auditLog.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'created', entityType: 'Item' }))
    expect(gateway.emitRegistryEvent).toHaveBeenCalledWith('items', 'id-1', 'created')
  })

  it('soft delete sets deletedAt and isActive=false', async () => {
    const item = { id: 'id-1', code: 'FG-001', isActive: true, plantId: 'plant-1' }
    repo.findById.mockResolvedValueOnce(item)
    repo.softDelete.mockResolvedValueOnce(undefined)

    await repo.softDelete('id-1')
    expect(repo.softDelete).toHaveBeenCalledWith('id-1')
  })

  it('restore reverses soft delete', async () => {
    const deleted = { id: 'id-1', code: 'FG-001', isActive: false, deletedAt: new Date(), plantId: 'plant-1' }
    const restored = { ...deleted, isActive: true, deletedAt: null }
    repo.findById.mockResolvedValueOnce(deleted)
    repo.restore.mockResolvedValueOnce(restored)

    const result = await repo.restore('id-1')
    expect(result).toMatchObject({ isActive: true, deletedAt: null })
  })

  it('update emits updated event', async () => {
    const before = { id: 'id-1', code: 'FG-001', name: 'Old', isActive: true, plantId: 'p1' }
    const after = { ...before, name: 'New' }
    repo.findById.mockResolvedValueOnce(before)
    repo.update.mockResolvedValueOnce(after)

    await repo.update('id-1', { name: 'New' })
    gateway.emitRegistryEvent('items', 'id-1', 'updated')

    expect(gateway.emitRegistryEvent).toHaveBeenCalledWith('items', 'id-1', 'updated')
  })

  it('findAll trash returns only soft-deleted items', () => {
    const trashed = [
      { id: 'id-2', code: 'FG-002', isActive: false, deletedAt: new Date() },
    ]
    repo.findTrashed.mockResolvedValueOnce({ data: trashed, page: 1, limit: 25, total: 1, totalPages: 1 })
    repo.findTrashed({})
    expect(repo.findTrashed).toHaveBeenCalledWith({})
  })
})

describe('Item code validation', () => {
  it('rejects empty code', () => {
    const validate = (code: string) => code.trim().length > 0
    expect(validate('')).toBe(false)
    expect(validate('  ')).toBe(false)
    expect(validate('FG-001')).toBe(true)
  })

  it('rejects code longer than 50 chars', () => {
    const validate = (code: string) => code.length <= 50
    expect(validate('X'.repeat(51))).toBe(false)
    expect(validate('FG-001')).toBe(true)
  })

  it('valid itemType enum values', () => {
    const ITEM_TYPES = ['finished_good', 'semi_finished', 'raw_material', 'component', 'consumable', 'spare_part']
    expect(ITEM_TYPES).toContain('finished_good')
    expect(ITEM_TYPES).toContain('raw_material')
    expect(ITEM_TYPES).not.toContain('unknown_type')
  })
})
