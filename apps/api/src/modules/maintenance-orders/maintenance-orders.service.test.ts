import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { MaintenanceOrdersService } from './maintenance-orders.service'

type FakeMnt = {
  id: string
  code: string
  equipmentNodeId: string
  type: string
  status: string
  priority: string
  description: string
  plannedStart: Date
  plannedEnd: Date
  actualStart: Date | null
  actualEnd: Date | null
  assignedToId: string | null
  startedBy: string | null
  completedBy: string | null
  cancelledBy: string | null
  cancelReason: string | null
  plantId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

const baseMnt = (over: Partial<FakeMnt> = {}): FakeMnt => ({
  id: 'mnt-1',
  code: 'MNT-2026-0001',
  equipmentNodeId: 'eq-1',
  type: 'preventive',
  status: 'scheduled',
  priority: 'normal',
  description: 'Cleaning + lubrication',
  plannedStart: new Date('2026-05-10T08:00:00Z'),
  plannedEnd: new Date('2026-05-10T11:00:00Z'),
  actualStart: null,
  actualEnd: null,
  assignedToId: null,
  startedBy: null,
  completedBy: null,
  cancelledBy: null,
  cancelReason: null,
  plantId: 'plant-1',
  createdAt: new Date('2026-05-04T10:00:00Z'),
  updatedAt: new Date('2026-05-04T10:00:00Z'),
  deletedAt: null,
  version: 1,
  createdBy: 'system',
  updatedBy: 'system',
  ...over,
})

function makeService(opts: {
  existingRow?: FakeMnt | null
  countByYear?: number
} = {}) {
  const findAllMock = vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 25, totalPages: 0 })
  const findByIdMock = vi.fn().mockResolvedValue(opts.existingRow ?? null)
  const createdRow = baseMnt({ id: 'mnt-new', code: `MNT-2026-${String((opts.countByYear ?? 0) + 1).padStart(4, '0')}` })
  const createMock = vi.fn().mockResolvedValue(createdRow)
  const updateMock = vi.fn().mockImplementation(async (_id: string, patch: Record<string, unknown>) => {
    const cur = opts.existingRow ?? baseMnt()
    return { ...cur, ...patch, version: cur.version + 1 }
  })
  const countByPlantAndYearMock = vi.fn().mockResolvedValue(opts.countByYear ?? 0)

  const repo = {
    findAll: findAllMock,
    findById: findByIdMock,
    create: createMock,
    update: updateMock,
    countByPlantAndYear: countByPlantAndYearMock,
  } as unknown as ConstructorParameters<typeof MaintenanceOrdersService>[3]

  const prisma = {
    maintenanceOrder: {
      findFirst: vi.fn().mockResolvedValue(opts.existingRow ?? null),
      findUnique: vi.fn().mockResolvedValue(opts.existingRow ?? null),
      update: vi.fn().mockResolvedValue(opts.existingRow ?? null),
    },
  } as unknown as ConstructorParameters<typeof MaintenanceOrdersService>[0]

  const recordMock = vi.fn().mockResolvedValue(undefined)
  const auditLog = {
    record: recordMock,
  } as unknown as ConstructorParameters<typeof MaintenanceOrdersService>[1]

  const emitMock = vi.fn()
  const gateway = {
    emit: emitMock,
  } as unknown as ConstructorParameters<typeof MaintenanceOrdersService>[2]

  const service = new MaintenanceOrdersService(prisma, auditLog, gateway, repo)
  return { service, findAllMock, findByIdMock, createMock, updateMock, countByPlantAndYearMock, recordMock, emitMock, createdRow }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MaintenanceOrdersService.create', () => {
  it('generates MNT-{YYYY}-{NNNN} code with zero-padded sequence based on existing count', async () => {
    const { service, createMock, countByPlantAndYearMock } = makeService({ countByYear: 7 })
    await service.create(
      {
        equipmentNodeId: 'eq-1',
        type: 'preventive',
        priority: 'normal',
        description: 'Cleaning',
        plannedStart: '2026-05-10T08:00:00Z',
        plannedEnd: '2026-05-10T11:00:00Z',
        plantId: 'plant-1',
      },
      'user-1',
    )
    expect(countByPlantAndYearMock).toHaveBeenCalledWith('plant-1', new Date().getFullYear())
    const arg = createMock.mock.calls[0]?.[0]
    expect(arg?.code).toMatch(/^MNT-\d{4}-0008$/)
    expect(arg?.equipmentNodeId).toBe('eq-1')
    expect(arg?.plannedStart).toBeInstanceOf(Date)
  })

  it('writes create audit log with plantId and entity payload', async () => {
    const { service, recordMock } = makeService({ countByYear: 0 })
    await service.create(
      {
        equipmentNodeId: 'eq-1',
        type: 'corrective',
        priority: 'urgent',
        description: 'Fix leak',
        plannedStart: '2026-05-10T08:00:00Z',
        plannedEnd: '2026-05-10T11:00:00Z',
        plantId: 'plant-1',
      },
      'user-1',
    )
    expect(recordMock).toHaveBeenCalledOnce()
    const audit = recordMock.mock.calls[0]?.[0]
    expect(audit?.entityType).toBe('MaintenanceOrder')
    expect(audit?.action).toBe('create')
    expect(audit?.changedBy).toBe('user-1')
    expect(audit?.plantId).toBe('plant-1')
  })
})

describe('MaintenanceOrdersService.findById', () => {
  it('returns the row when found', async () => {
    const row = baseMnt()
    const { service } = makeService({ existingRow: row })
    const found = await service.findById('mnt-1')
    expect(found.id).toBe('mnt-1')
    expect(found.code).toBe('MNT-2026-0001')
  })

  it('throws NotFound when row is missing', async () => {
    const { service } = makeService({ existingRow: null })
    await expect(service.findById('does-not-exist')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('MaintenanceOrdersService.update', () => {
  it('updates a scheduled order and writes update audit log', async () => {
    const row = baseMnt({ status: 'scheduled' })
    const { service, updateMock, recordMock } = makeService({ existingRow: row })
    await service.update('mnt-1', { description: 'Updated description' }, 'user-2')
    expect(updateMock).toHaveBeenCalledOnce()
    const arg = updateMock.mock.calls[0]?.[1]
    expect(arg?.description).toBe('Updated description')
    expect(arg?.updatedBy).toBe('user-2')
    expect(recordMock).toHaveBeenCalledOnce()
    expect(recordMock.mock.calls[0]?.[0]?.action).toBe('update')
  })

  it('rejects update when status is not scheduled', async () => {
    const row = baseMnt({ status: 'in_progress' })
    const { service, updateMock } = makeService({ existingRow: row })
    await expect(
      service.update('mnt-1', { description: 'Should fail' }, 'user-2'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
    expect(updateMock).not.toHaveBeenCalled()
  })
})
