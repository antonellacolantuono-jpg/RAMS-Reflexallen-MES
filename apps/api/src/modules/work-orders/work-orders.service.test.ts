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

// ============================================================
// PROMPT_DESIGN_ALIGNMENT D3 batch 9 — findDetail (back-office WO detail)
// ============================================================

type FakeWODetail = {
  id: string
  code: string
  status: string
  priority: string
  type: string
  qtyTarget: number
  qtyProduced: number
  qtyScrap: number
  qtyRework: number
  scheduledStart: Date | null
  scheduledEnd: Date | null
  actualStart: Date | null
  actualEnd: Date | null
  releasedAt: Date | null
  releasedBy: string | null
  notes: string | null
  plantId: string
  createdAt: Date
  updatedAt: Date
  item: { id: string; code: string; name: string; uom: string }
  bom: {
    id: string
    version: number
    lines: Array<{ id: string; componentId: string; qty: number; uom: string; position: number }>
  } | null
  workflowSnapshot: {
    id: string
    workflowVersionId: string
    snapshotData: string
    createdAt: Date
  } | null
  assignments: Array<{
    operatorId: string
    status: string
    assignedAt: Date
    acceptedAt: Date | null
    operator: { badge: string; firstName: string; lastName: string }
  }>
}

function makeDetailPrisma(opts: {
  wo: FakeWODetail | null
  components?: Array<{ id: string; code: string; name: string }>
  stepExecs?: Array<{ status: string; result: string | null }>
}) {
  return {
    workOrder: {
      findFirst: vi.fn().mockResolvedValue(opts.wo),
    },
    item: {
      findMany: vi.fn().mockResolvedValue(opts.components ?? []),
    },
    stepExecution: {
      findMany: vi.fn().mockResolvedValue(opts.stepExecs ?? []),
    },
  } as unknown as ConstructorParameters<typeof WorkOrdersService>[0]
}

function fixtureDetailWO(over: Partial<FakeWODetail> = {}): FakeWODetail {
  return {
    id: 'wo-detail-1',
    code: 'WO-2026-PNE-0042',
    status: 'in_progress',
    priority: 'high',
    type: 'production',
    qtyTarget: 100,
    qtyProduced: 42,
    qtyScrap: 2,
    qtyRework: 1,
    scheduledStart: new Date('2026-04-30T06:00:00Z'),
    scheduledEnd: new Date('2026-05-01T14:00:00Z'),
    actualStart: new Date('2026-04-30T06:14:00Z'),
    actualEnd: null,
    releasedAt: new Date('2026-04-29T18:42:00Z'),
    releasedBy: 'system',
    notes: 'Demo Pneumatic Air',
    plantId: 'plant-1',
    createdAt: new Date('2026-04-29T14:00:00Z'),
    updatedAt: new Date('2026-04-30T07:00:00Z'),
    item: { id: 'item-1', code: 'PNE-TUBE-12-680', name: 'Tubo PA12 12mm 680mm', uom: 'pc' },
    bom: null,
    workflowSnapshot: null,
    assignments: [],
    ...over,
  }
}

describe('WorkOrdersService.findDetail', () => {
  it('throws NotFoundException when WO does not exist', async () => {
    const prisma = makeDetailPrisma({ wo: null })
    const service = new WorkOrdersService(prisma)
    await expect(service.findDetail('missing')).rejects.toThrow('not found')
  })

  it('returns scalar fields + item + empty bom/snapshot/assignments', async () => {
    const prisma = makeDetailPrisma({ wo: fixtureDetailWO() })
    const service = new WorkOrdersService(prisma)
    const result = await service.findDetail('wo-detail-1')
    expect(result.id).toBe('wo-detail-1')
    expect(result.code).toBe('WO-2026-PNE-0042')
    expect(result.qtyTarget).toBe(100)
    expect(result.qtyProduced).toBe(42)
    expect(result.qtyScrap).toBe(2)
    expect(result.qtyRework).toBe(1)
    expect(result.scheduledStart).toBe('2026-04-30T06:00:00.000Z')
    expect(result.releasedAt).toBe('2026-04-29T18:42:00.000Z')
    expect(result.releasedBy).toBe('system')
    expect(result.item).toEqual({
      id: 'item-1',
      code: 'PNE-TUBE-12-680',
      name: 'Tubo PA12 12mm 680mm',
      uom: 'pc',
    })
    expect(result.bom).toBeNull()
    expect(result.workflowSnapshot).toBeNull()
    expect(result.assignments).toEqual([])
    expect(result.stepExecutionStats).toEqual({ total: 0, pending: 0, running: 0, done: 0, nok: 0 })
  })

  it('joins BoM line componentIds with separately-fetched item codes/names', async () => {
    const wo = fixtureDetailWO({
      bom: {
        id: 'bom-1',
        version: 3,
        lines: [
          { id: 'l-1', componentId: 'cmp-A', qty: 2, uom: 'pc', position: 0 },
          { id: 'l-2', componentId: 'cmp-B', qty: 0.5, uom: 'kg', position: 1 },
          { id: 'l-3', componentId: 'cmp-missing', qty: 1, uom: 'pc', position: 2 },
        ],
      },
    })
    const prisma = makeDetailPrisma({
      wo,
      components: [
        { id: 'cmp-A', code: 'ITM-CMP-A', name: 'Componente A' },
        { id: 'cmp-B', code: 'ITM-CMP-B', name: 'Componente B' },
      ],
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findDetail('wo-detail-1')
    expect(result.bom?.id).toBe('bom-1')
    expect(result.bom?.version).toBe(3)
    expect(result.bom?.lines).toEqual([
      { id: 'l-1', componentCode: 'ITM-CMP-A', componentName: 'Componente A', qty: 2, uom: 'pc' },
      { id: 'l-2', componentCode: 'ITM-CMP-B', componentName: 'Componente B', qty: 0.5, uom: 'kg' },
      // missing component falls back to id + placeholder name (tracked but not crashy)
      { id: 'l-3', componentCode: 'cmp-missing', componentName: '(componente sconosciuto)', qty: 1, uom: 'pc' },
    ])
  })

  it('parses workflowSnapshot.snapshotData JSON into projection', async () => {
    const snapshotData = JSON.stringify({
      schemaVersion: 1,
      workflowVersionNumber: 3,
      phases: [
        {
          id: 'p-1',
          order: 1,
          category: 'production',
          name: 'Estrusione',
          isAutoGenerated: false,
          imageUrl: 'data:image/png;base64,PHASE',
          groups: [
            {
              id: 'g-1',
              order: 1,
              category: 'main',
              name: 'Avvio linea',
              isAutoGenerated: false,
              steps: [
                {
                  id: 's-1',
                  order: 1,
                  category: 'identification',
                  actionType: 'scan_qr',
                  name: 'Scan ricetta',
                  deviceCategory: null,
                  partReference: null,
                  standardTimeSec: 30,
                },
                {
                  id: 's-2',
                  order: 2,
                  category: 'production',
                  actionType: 'device_cycle',
                  name: 'Cycle parallel',
                  deviceCategory: 'parallel',
                  partReference: 'main',
                  standardTimeSec: 90,
                },
              ],
            },
          ],
        },
      ],
    })
    const wo = fixtureDetailWO({
      workflowSnapshot: {
        id: 'snap-1',
        workflowVersionId: 'wfv-1',
        snapshotData,
        createdAt: new Date('2026-04-29T18:42:00Z'),
      },
    })
    const prisma = makeDetailPrisma({ wo })
    const service = new WorkOrdersService(prisma)
    const result = await service.findDetail('wo-detail-1')
    expect(result.workflowSnapshot?.id).toBe('snap-1')
    expect(result.workflowSnapshot?.snapshotData?.workflowVersionNumber).toBe(3)
    expect(result.workflowSnapshot?.snapshotData?.phases[0]?.name).toBe('Estrusione')
    expect(result.workflowSnapshot?.snapshotData?.phases[0]?.imageUrl).toBe(
      'data:image/png;base64,PHASE',
    )
    expect(result.workflowSnapshot?.snapshotData?.phases[0]?.groups[0]?.steps[1]).toEqual({
      id: 's-2',
      order: 2,
      category: 'production',
      actionType: 'device_cycle',
      name: 'Cycle parallel',
      deviceCategory: 'parallel',
      partReference: 'main',
      standardTimeSec: 90,
    })
  })

  it('returns snapshot with snapshotData=null when JSON parse fails', async () => {
    const wo = fixtureDetailWO({
      workflowSnapshot: {
        id: 'snap-bad',
        workflowVersionId: 'wfv-bad',
        snapshotData: '{"phases": [malformed]',
        createdAt: new Date(),
      },
    })
    const prisma = makeDetailPrisma({ wo })
    const service = new WorkOrdersService(prisma)
    const result = await service.findDetail('wo-detail-1')
    expect(result.workflowSnapshot?.id).toBe('snap-bad')
    expect(result.workflowSnapshot?.snapshotData).toBeNull()
  })

  it('aggregates step-execution counts across statuses + nok results', async () => {
    const wo = fixtureDetailWO()
    const prisma = makeDetailPrisma({
      wo,
      stepExecs: [
        { status: 'pending', result: null },
        { status: 'pending', result: null },
        { status: 'running', result: null },
        { status: 'paused', result: null },
        { status: 'qc_hold', result: null },
        { status: 'done', result: 'ok' },
        { status: 'done', result: 'ok' },
        { status: 'done', result: 'nok' },
        { status: 'recovered', result: 'ok' },
      ],
    })
    const service = new WorkOrdersService(prisma)
    const result = await service.findDetail('wo-detail-1')
    expect(result.stepExecutionStats).toEqual({
      total: 9,
      pending: 2,
      // running + paused + blocked + qc_hold all bucketed as in-progress
      running: 3,
      // done + recovered count as terminal-success
      done: 4,
      // nok counted independently of status
      nok: 1,
    })
  })

  it('maps assignments with operator name + badge + accepted/assigned timestamps', async () => {
    const wo = fixtureDetailWO({
      assignments: [
        {
          operatorId: 'op-1',
          status: 'accepted',
          assignedAt: new Date('2026-04-29T18:42:00Z'),
          acceptedAt: new Date('2026-04-30T05:55:00Z'),
          operator: { badge: '1234', firstName: 'Mario', lastName: 'Rossi' },
        },
        {
          operatorId: 'op-2',
          status: 'declined',
          assignedAt: new Date('2026-04-29T16:00:00Z'),
          acceptedAt: null,
          operator: { badge: '5678', firstName: 'Anna', lastName: 'Verdi' },
        },
      ],
    })
    const prisma = makeDetailPrisma({ wo })
    const service = new WorkOrdersService(prisma)
    const result = await service.findDetail('wo-detail-1')
    expect(result.assignments).toEqual([
      {
        operatorId: 'op-1',
        operatorBadge: '1234',
        operatorName: 'Mario Rossi',
        status: 'accepted',
        assignedAt: '2026-04-29T18:42:00.000Z',
        acceptedAt: '2026-04-30T05:55:00.000Z',
      },
      {
        operatorId: 'op-2',
        operatorBadge: '5678',
        operatorName: 'Anna Verdi',
        status: 'declined',
        assignedAt: '2026-04-29T16:00:00.000Z',
        acceptedAt: null,
      },
    ])
  })

  it('skips component lookup when WO has no BoM (avoids unnecessary query)', async () => {
    const prisma = makeDetailPrisma({ wo: fixtureDetailWO() })
    const service = new WorkOrdersService(prisma)
    await service.findDetail('wo-detail-1')
    expect(
      (prisma.item.findMany as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(0)
  })
})
