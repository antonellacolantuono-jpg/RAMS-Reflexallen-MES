import { describe, it, expect, vi } from 'vitest'
import { WorkOrdersService } from './work-orders.service'

type FakeAssignment = {
  status: string
  workOrder: {
    id: string
    code: string
    status: string
    priority: string
    qtyTarget: number
    qtyProduced: number
    actualStart: Date | null
    deletedAt: Date | null
    item: { code: string; name: string }
  }
}

function makePrisma(opts: {
  assignments: FakeAssignment[]
  shiftAssignment?: { shift: { code: string } } | null
}) {
  return {
    workOrderAssignment: {
      findMany: vi.fn().mockResolvedValue(opts.assignments),
    },
    shiftAssignment: {
      findFirst: vi.fn().mockResolvedValue(opts.shiftAssignment ?? null),
    },
  } as unknown as ConstructorParameters<typeof WorkOrdersService>[0]
}

const baseWO = (over: Partial<FakeAssignment['workOrder']> = {}): FakeAssignment['workOrder'] => ({
  id: 'wo-1',
  code: 'WO-2026-0001',
  status: 'in_progress',
  priority: 'normal',
  qtyTarget: 100,
  qtyProduced: 25,
  actualStart: new Date('2026-04-30T08:00:00Z'),
  deletedAt: null,
  item: { code: 'FG-PNEU-5M-8MM', name: 'Tubo pneumatico PA12 5m' },
  ...over,
})

describe('WorkOrdersService.findMine', () => {
  it('returns mapped WO list for operator', async () => {
    const prisma = makePrisma({
      assignments: [{ status: 'active', workOrder: baseWO() }],
      shiftAssignment: { shift: { code: 'A' } },
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findMine('op-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'wo-1',
      code: 'WO-2026-0001',
      itemCode: 'FG-PNEU-5M-8MM',
      itemName: 'Tubo pneumatico PA12 5m',
      quantity: 100,
      completed: 25,
      priority: 'normal',
      status: 'in_progress',
      startedAt: '2026-04-30T08:00:00.000Z',
      shiftCode: 'A',
    })
  })

  it('queries WorkOrderAssignment with operatorId and active statuses only', async () => {
    const prisma = makePrisma({ assignments: [] })
    const service = new WorkOrdersService(prisma)
    await service.findMine('op-1')
    expect(prisma.workOrderAssignment.findMany).toHaveBeenCalledWith({
      where: {
        operatorId: 'op-1',
        status: { in: ['accepted', 'active'] },
      },
      include: { workOrder: { include: { item: true } } },
    })
  })

  it('excludes work orders with status draft/closed/cancelled', async () => {
    const prisma = makePrisma({
      assignments: [
        { status: 'accepted', workOrder: baseWO({ id: 'wo-draft', status: 'draft' }) },
        { status: 'accepted', workOrder: baseWO({ id: 'wo-closed', status: 'closed' }) },
        { status: 'accepted', workOrder: baseWO({ id: 'wo-cancelled', status: 'cancelled' }) },
        { status: 'in_progress', workOrder: baseWO({ id: 'wo-active' }) },
      ],
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findMine('op-1')
    expect(result.map((r) => r.id)).toEqual(['wo-active'])
  })

  it('excludes soft-deleted work orders', async () => {
    const prisma = makePrisma({
      assignments: [
        { status: 'accepted', workOrder: baseWO({ id: 'wo-deleted', deletedAt: new Date() }) },
        { status: 'accepted', workOrder: baseWO({ id: 'wo-live' }) },
      ],
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findMine('op-1')
    expect(result.map((r) => r.id)).toEqual(['wo-live'])
  })

  it('maps released/scheduled status to "ready"', async () => {
    const prisma = makePrisma({
      assignments: [
        { status: 'accepted', workOrder: baseWO({ id: 'wo-released', status: 'released' }) },
        { status: 'accepted', workOrder: baseWO({ id: 'wo-scheduled', status: 'scheduled' }) },
      ],
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findMine('op-1')
    expect(result.map((r) => r.status)).toEqual(['ready', 'ready'])
  })

  it('returns shiftCode null when no ShiftAssignment exists today', async () => {
    const prisma = makePrisma({
      assignments: [{ status: 'active', workOrder: baseWO() }],
      shiftAssignment: null,
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findMine('op-1')
    expect(result[0]?.shiftCode).toBeNull()
  })

  it('queries ShiftAssignment within today date range', async () => {
    const prisma = makePrisma({ assignments: [] })
    const service = new WorkOrdersService(prisma)
    const fixedNow = new Date('2026-04-30T14:00:00Z')
    await service.findMine('op-1', fixedNow)
    const call = (prisma.shiftAssignment.findFirst as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
    expect(call?.where?.operatorId).toBe('op-1')
    expect(call?.where?.date?.gte).toBeInstanceOf(Date)
    expect(call?.where?.date?.lte).toBeInstanceOf(Date)
  })
})
