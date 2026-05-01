import { describe, it, expect, vi } from 'vitest'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { QcReviewService } from './qc-review.service'

type FakeOperator = {
  id: string
  badge: string
  operatorSkills: Array<{ skill: { code: string } }>
} | null

type FakeRow = {
  id: string
  workOrderId: string
  stepId: string
  operatorId: string | null
  status: string
  startedAt: Date | null
  durationSec: number | null
  step: { name: string; category: string }
  workOrder: { plantId: string; deletedAt: Date | null; code: string }
}

const baseHoldRow = (over: Partial<FakeRow> = {}): FakeRow => ({
  id: 'se-1',
  workOrderId: 'wo-1',
  stepId: 'step-1',
  operatorId: 'op-1',
  status: 'qc_hold',
  startedAt: new Date('2026-04-30T10:00:00Z'),
  durationSec: 120,
  step: { name: 'Visual check', category: 'quality_control' },
  workOrder: { plantId: 'plant-1', deletedAt: null, code: 'WO-001' },
  ...over,
})

function makeService(opts: {
  operator?: FakeOperator
  holdRow?: FakeRow | null
  listRows?: FakeRow[]
  listOperators?: Array<{ id: string; badge: string }>
}) {
  const operatorMock = vi
    .fn()
    .mockImplementation(async (args: { where?: { id?: string } }) => {
      if (args?.where?.id) return opts.operator ?? null
      return opts.operator ?? null
    })
  const operatorFindManyMock = vi.fn().mockResolvedValue(opts.listOperators ?? [])
  const stepFindUniqueMock = vi.fn().mockResolvedValue(opts.holdRow ?? null)
  const stepFindManyMock = vi.fn().mockResolvedValue(opts.listRows ?? [])

  const prisma = {
    operator: { findFirst: operatorMock, findMany: operatorFindManyMock },
    stepExecution: { findUnique: stepFindUniqueMock, findMany: stepFindManyMock },
  } as unknown as ConstructorParameters<typeof QcReviewService>[0]

  const applyTransitionMock = vi.fn().mockResolvedValue({
    stepExecutionId: 'se-1',
    workOrderId: 'wo-1',
    fromStatus: 'qc_hold',
    toStatus: 'done',
    event: 'QC_APPROVE',
    changedAt: '2026-05-01T10:00:00.000Z',
    notes: [],
    causeCode: null,
    recoveryStage: null,
    attemptCount: 0,
    autoScrapped: false,
  })
  const stepExecutions = {
    applyTransition: applyTransitionMock,
  } as unknown as ConstructorParameters<typeof QcReviewService>[1]

  const service = new QcReviewService(prisma, stepExecutions)
  return {
    service,
    applyTransitionMock,
    operatorMock,
    operatorFindManyMock,
    stepFindManyMock,
  }
}

describe('QcReviewService.hasQcSkill', () => {
  it('returns true when operator has QC skill', async () => {
    const { service } = makeService({
      operator: {
        id: 'op-1',
        badge: 'OP-001',
        operatorSkills: [
          { skill: { code: 'EXT' } },
          { skill: { code: 'QC' } },
        ],
      },
    })
    expect(await service.hasQcSkill('op-1', 'plant-1')).toBe(true)
  })

  it('returns false when operator lacks QC skill', async () => {
    const { service } = makeService({
      operator: {
        id: 'op-1',
        badge: 'OP-001',
        operatorSkills: [{ skill: { code: 'EXT' } }],
      },
    })
    expect(await service.hasQcSkill('op-1', 'plant-1')).toBe(false)
  })

  it('returns false when operator does not exist in plant', async () => {
    const { service } = makeService({ operator: null })
    expect(await service.hasQcSkill('op-1', 'plant-1')).toBe(false)
  })
})

describe('QcReviewService.approve', () => {
  it('approves a qc_hold step and forwards QC_APPROVE event', async () => {
    const { service, applyTransitionMock } = makeService({
      operator: {
        id: 'sup-1',
        badge: 'OP-002',
        operatorSkills: [{ skill: { code: 'QC' } }],
      },
      holdRow: baseHoldRow(),
    })
    const result = await service.approve({
      stepExecutionId: 'se-1',
      approverId: 'sup-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('done')
    expect(applyTransitionMock).toHaveBeenCalledOnce()
    const call = applyTransitionMock.mock.calls[0]?.[0]
    expect(call?.event?.type).toBe('QC_APPROVE')
    expect(call?.event?.approverId).toBe('sup-1')
    expect(call?.changedBy).toBe('sup-1')
    expect(call?.plantId).toBe('plant-1')
  })

  it('rejects approval when operator lacks QC skill (403)', async () => {
    const { service, applyTransitionMock } = makeService({
      operator: {
        id: 'op-1',
        badge: 'OP-001',
        operatorSkills: [{ skill: { code: 'EXT' } }],
      },
      holdRow: baseHoldRow(),
    })
    await expect(
      service.approve({
        stepExecutionId: 'se-1',
        approverId: 'op-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(applyTransitionMock).not.toHaveBeenCalled()
  })

  it('throws NotFound when stepExecution is not in qc_hold', async () => {
    const { service } = makeService({
      operator: {
        id: 'sup-1',
        badge: 'OP-002',
        operatorSkills: [{ skill: { code: 'QC' } }],
      },
      holdRow: baseHoldRow({ status: 'running' }),
    })
    await expect(
      service.approve({
        stepExecutionId: 'se-1',
        approverId: 'sup-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('enforces plant scoping (NotFound for cross-plant access)', async () => {
    const { service } = makeService({
      operator: {
        id: 'sup-1',
        badge: 'OP-002',
        operatorSkills: [{ skill: { code: 'QC' } }],
      },
      holdRow: baseHoldRow({
        workOrder: { plantId: 'plant-OTHER', deletedAt: null, code: 'WO-X' },
      }),
    })
    await expect(
      service.approve({
        stepExecutionId: 'se-1',
        approverId: 'sup-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('QcReviewService.reject', () => {
  it('rejects a qc_hold step with reason and forwards QC_REJECT event', async () => {
    const { service, applyTransitionMock } = makeService({
      operator: {
        id: 'sup-1',
        badge: 'OP-002',
        operatorSkills: [{ skill: { code: 'QC' } }],
      },
      holdRow: baseHoldRow(),
    })
    applyTransitionMock.mockResolvedValueOnce({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      fromStatus: 'qc_hold',
      toStatus: 'blocked',
      event: 'QC_REJECT',
      changedAt: '2026-05-01T10:00:00.000Z',
      notes: ['qc_reject by sup-1: needs rework'],
      causeCode: 'qc_reject',
      recoveryStage: 'diagnosis',
      attemptCount: 0,
      autoScrapped: false,
    })
    const result = await service.reject({
      stepExecutionId: 'se-1',
      approverId: 'sup-1',
      plantId: 'plant-1',
      reason: 'needs rework',
    })
    expect(result.toStatus).toBe('blocked')
    const call = applyTransitionMock.mock.calls[0]?.[0]
    expect(call?.event?.type).toBe('QC_REJECT')
    expect(call?.event?.reason).toBe('needs rework')
    expect(call?.event?.approverId).toBe('sup-1')
  })

  it('rejects without reason fails with ForbiddenException', async () => {
    const { service, applyTransitionMock } = makeService({
      operator: {
        id: 'sup-1',
        badge: 'OP-002',
        operatorSkills: [{ skill: { code: 'QC' } }],
      },
      holdRow: baseHoldRow(),
    })
    await expect(
      service.reject({
        stepExecutionId: 'se-1',
        approverId: 'sup-1',
        plantId: 'plant-1',
        reason: '',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(applyTransitionMock).not.toHaveBeenCalled()
  })
})

describe('QcReviewService.listHolds', () => {
  it('returns plant-scoped qc_hold step executions with operator badge', async () => {
    const { service } = makeService({
      listRows: [baseHoldRow()],
      listOperators: [{ id: 'op-1', badge: 'OP-001' }],
    })
    const result = await service.listHolds('plant-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      stepExecutionId: 'se-1',
      workOrderCode: 'WO-001',
      stepName: 'Visual check',
      stepCategory: 'quality_control',
      operatorBadge: 'OP-001',
    })
  })

  it('returns empty list when no holds', async () => {
    const { service } = makeService({ listRows: [] })
    const result = await service.listHolds('plant-1')
    expect(result).toEqual([])
  })
})
