import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { StepExecutionService } from './step-execution.service'

type FakeStep = {
  groupId: string
  category: string
  name: string
  order: number
  actionType: string
  instructions: string | null
  deviceCategory: string | null
  group: {
    id: string
    name: string
    category: string
    supportsParallel: boolean
  }
}

type FakeRow = {
  id: string
  workOrderId: string
  stepId: string
  operatorId: string | null
  status: string
  result: string | null
  durationSec: number | null
  notes: string | null
  startedAt: Date | null
  completedAt: Date | null
  step: FakeStep
  workOrder: { plantId: string; deletedAt: Date | null }
}

const makeStep = (over: Partial<FakeStep> = {}): FakeStep => ({
  groupId: 'g-1',
  category: 'production',
  name: 'Crimping',
  order: 3,
  actionType: 'process',
  instructions: 'Crimp connector to spec',
  deviceCategory: null,
  group: {
    id: 'g-1',
    name: 'Crimping group',
    category: 'assembly',
    supportsParallel: false,
  },
  ...over,
})

const baseRow = (over: Partial<FakeRow> = {}): FakeRow => ({
  id: 'se-1',
  workOrderId: 'wo-1',
  stepId: 'step-1',
  operatorId: 'op-1',
  status: 'pending',
  result: null,
  durationSec: null,
  notes: null,
  startedAt: null,
  completedAt: null,
  step: over.step ?? makeStep(),
  workOrder: { plantId: 'plant-1', deletedAt: null },
  ...over,
})

function makeService(
  row: FakeRow | null,
  options: { siblings?: FakeRow[] } = {},
) {
  const updateMock = vi.fn().mockResolvedValue({})
  const findUniqueMock = vi.fn().mockResolvedValue(row)
  const findFirstMock = vi.fn().mockResolvedValue(row ? { id: row.workOrderId } : null)
  const findManyMock = vi
    .fn()
    .mockImplementation(async (args: { include?: { step?: { include?: { group?: boolean } } } }) => {
      if (!row) return []
      // findStepsForWorkOrder calls with include.step.include.group → return single row by default
      if (args?.include?.step?.include?.group) {
        return [row]
      }
      // Sibling lookup in maybeEmitParallelSync uses include.step.select
      return options.siblings ?? [row]
    })
  const prisma = {
    stepExecution: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
      update: updateMock,
    },
    workOrder: {
      findFirst: findFirstMock,
    },
  } as unknown as ConstructorParameters<typeof StepExecutionService>[0]

  const recordMock = vi.fn().mockResolvedValue(undefined)
  const auditLog = {
    record: recordMock,
  } as unknown as ConstructorParameters<typeof StepExecutionService>[1]

  const emitMock = vi.fn()
  const emitParallelSyncMock = vi.fn()
  const events = {
    emitStepTransition: emitMock,
    emitParallelSync: emitParallelSyncMock,
  } as unknown as ConstructorParameters<typeof StepExecutionService>[2]

  const service = new StepExecutionService(prisma, auditLog, events)
  return {
    service,
    updateMock,
    recordMock,
    emitMock,
    emitParallelSyncMock,
    findManyMock,
    findFirstMock,
  }
}

describe('StepExecutionService.applyTransition', () => {
  it('pending → running on START persists status and writes audit log', async () => {
    const { service, updateMock, recordMock, emitMock } = makeService(baseRow())
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'START', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.fromStatus).toBe('pending')
    expect(result.toStatus).toBe('running')
    expect(updateMock).toHaveBeenCalledOnce()
    const updateArg = updateMock.mock.calls[0]?.[0]
    expect(updateArg?.where).toEqual({ id: 'se-1' })
    expect(updateArg?.data?.status).toBe('running')
    expect(recordMock).toHaveBeenCalledOnce()
    const audit = recordMock.mock.calls[0]?.[0]
    expect(audit?.entityType).toBe('StepExecution')
    expect(audit?.entityId).toBe('se-1')
    expect(audit?.action).toBe('state_change')
    expect(audit?.plantId).toBe('plant-1')
    expect(emitMock).toHaveBeenCalledOnce()
    expect(emitMock.mock.calls[0]?.[0]?.toStatus).toBe('running')
  })

  it('running → done on COMPLETE_OK sets result=ok and completedAt', async () => {
    const { service, updateMock } = makeService(
      baseRow({ status: 'running', startedAt: new Date('2026-04-30T10:00:00Z') }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1', durationSec: 45 },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('done')
    const updateArg = updateMock.mock.calls[0]?.[0]
    expect(updateArg?.data?.result).toBe('ok')
    expect(updateArg?.data?.completedAt).toBeInstanceOf(Date)
    expect(updateArg?.data?.durationSec).toBe(45)
  })

  it('running → blocked on COMPLETE_NOK sets result=nok and stores cause + note', async () => {
    const { service, updateMock } = makeService(baseRow({ status: 'running' }))
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: {
        type: 'COMPLETE_NOK',
        by: 'op-1',
        causeCode: 'leak_test_fail',
        notes: 'pressure dropped',
      },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('blocked')
    expect(result.causeCode).toBe('leak_test_fail')
    expect(result.notes).toContain('nok: pressure dropped')
    const updateArg = updateMock.mock.calls[0]?.[0]
    expect(updateArg?.data?.result).toBe('nok')
    expect(updateArg?.data?.completedAt).toBeNull()
  })

  it('REQUEST_QC is rejected (422) when stepCategory is not quality_control', async () => {
    const { service } = makeService(baseRow({ status: 'running' }))
    await expect(
      service.applyTransition({
        stepExecutionId: 'se-1',
        workOrderId: 'wo-1',
        event: { type: 'REQUEST_QC', by: 'op-1' },
        changedBy: 'op-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it('REQUEST_QC succeeds when stepCategory=quality_control', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'running',
        step: makeStep({
          category: 'quality_control',
          name: 'Visual check',
          order: 5,
          actionType: 'visual_check',
          instructions: null,
        }),
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'REQUEST_QC', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('qc_hold')
    const updateArg = updateMock.mock.calls[0]?.[0]
    expect(updateArg?.data?.status).toBe('qc_hold')
  })

  it('rejects invalid event payload with BadRequestException', async () => {
    const { service } = makeService(baseRow())
    await expect(
      service.applyTransition({
        stepExecutionId: 'se-1',
        workOrderId: 'wo-1',
        event: { type: 'NOT_A_REAL_EVENT' },
        changedBy: 'op-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws NotFound when stepExecution not in caller plant', async () => {
    const { service } = makeService(
      baseRow({ workOrder: { plantId: 'plant-OTHER', deletedAt: null } }),
    )
    await expect(
      service.applyTransition({
        stepExecutionId: 'se-1',
        workOrderId: 'wo-1',
        event: { type: 'START', by: 'op-1' },
        changedBy: 'op-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws NotFound when stepExecution.workOrderId mismatches request', async () => {
    const { service } = makeService(baseRow())
    await expect(
      service.applyTransition({
        stepExecutionId: 'se-1',
        workOrderId: 'wo-OTHER',
        event: { type: 'START', by: 'op-1' },
        changedBy: 'op-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('CANCEL from running transitions to cancelled and sets completedAt', async () => {
    const { service, updateMock, emitMock } = makeService(
      baseRow({ status: 'running' }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'CANCEL', by: 'sup-1', reason: 'WO closeout' },
      changedBy: 'sup-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('cancelled')
    expect(updateMock.mock.calls[0]?.[0]?.data?.completedAt).toBeInstanceOf(Date)
    expect(emitMock).toHaveBeenCalledOnce()
  })

  it('SKIP from blocked transitions to skipped and sets result=skipped', async () => {
    const { service, updateMock } = makeService(baseRow({ status: 'blocked' }))
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'SKIP', by: 'sup-1', reason: 'redo elsewhere' },
      changedBy: 'sup-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('skipped')
    expect(updateMock.mock.calls[0]?.[0]?.data?.result).toBe('skipped')
  })

  it('refresh-from-DB: a row already in qc_hold can transition to done via QC_APPROVE', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'qc_hold',
        step: makeStep({
          category: 'quality_control',
          name: 'Reflectance test',
          order: 7,
          actionType: 'functional_test',
          instructions: null,
        }),
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'QC_APPROVE', by: 'sup-1', approverId: 'sup-1' },
      changedBy: 'sup-1',
      plantId: 'plant-1',
    })
    expect(result.fromStatus).toBe('qc_hold')
    expect(result.toStatus).toBe('done')
    expect(updateMock.mock.calls[0]?.[0]?.data?.result).toBe('ok')
  })

  it('audit-log payload contains before.status, after.status, and event type', async () => {
    const { service, recordMock } = makeService(baseRow({ status: 'running' }))
    await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'PAUSE', by: 'op-1', reason: 'lunch' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    const audit = recordMock.mock.calls[0]?.[0]
    expect(audit?.before).toEqual({ status: 'running' })
    expect(audit?.after?.status).toBe('paused')
    expect(audit?.after?.event).toBe('PAUSE')
  })
})

describe('StepExecutionService.findStepsForWorkOrder', () => {
  it('returns mapped step list scoped to plant', async () => {
    const { service, findFirstMock, findManyMock } = makeService(baseRow())
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 'wo-1', plantId: 'plant-1', deletedAt: null },
      select: { id: true },
    })
    expect(findManyMock).toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      stepExecutionId: 'se-1',
      stepName: 'Crimping',
      stepCategory: 'production',
      stepOrder: 3,
      status: 'pending',
    })
  })

  it('exposes group + deviceCategory fields on the DTO for swimlane rendering', async () => {
    const { service } = makeService(
      baseRow({
        step: makeStep({
          groupId: 'g-dx',
          deviceCategory: 'parallel',
          group: {
            id: 'g-dx',
            name: 'Cura autoclave',
            category: 'device_execution',
            supportsParallel: true,
          },
        }),
      }),
    )
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(result[0]).toMatchObject({
      deviceCategory: 'parallel',
      groupId: 'g-dx',
      groupName: 'Cura autoclave',
      groupCategory: 'device_execution',
      groupSupportsParallel: true,
    })
  })

  it('throws NotFound when WO is not in caller plant', async () => {
    const { service } = makeService(null)
    await expect(
      service.findStepsForWorkOrder('wo-1', 'plant-1'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('StepExecutionService.applyTransition — parallel sync', () => {
  const parallelStep = (over: Partial<FakeStep> = {}) =>
    makeStep({
      groupId: 'g-dx',
      group: {
        id: 'g-dx',
        name: 'Cura',
        category: 'device_execution',
        supportsParallel: true,
      },
      deviceCategory: 'parallel',
      ...over,
    })

  it('does not emit parallel-sync when the group is not parallel', async () => {
    const { service, emitParallelSyncMock } = makeService(
      baseRow({ status: 'running' }),
    )
    await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(emitParallelSyncMock).not.toHaveBeenCalled()
  })

  it('does not emit parallel-sync when transitioned step is not on a parallel lane', async () => {
    const mainRow = baseRow({
      status: 'running',
      step: parallelStep({ deviceCategory: 'device_main' }),
    })
    const siblings: FakeRow[] = [
      mainRow,
      baseRow({ id: 'se-p1', status: 'done', step: parallelStep() }),
    ]
    const { service, emitParallelSyncMock } = makeService(mainRow, { siblings })
    await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(emitParallelSyncMock).not.toHaveBeenCalled()
  })

  it('does not emit parallel-sync while at least one parallel sibling is still running', async () => {
    const target = baseRow({
      id: 'se-p1',
      status: 'running',
      step: parallelStep({ order: 2 }),
    })
    const siblings: FakeRow[] = [
      target,
      baseRow({ id: 'se-p2', status: 'running', step: parallelStep({ order: 3 }) }),
      baseRow({
        id: 'se-main',
        status: 'running',
        step: parallelStep({ order: 1, deviceCategory: 'device_main' }),
      }),
    ]
    const { service, emitParallelSyncMock } = makeService(target, { siblings })
    await service.applyTransition({
      stepExecutionId: 'se-p1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(emitParallelSyncMock).not.toHaveBeenCalled()
  })

  it('emits parallel-sync when the last parallel lane transitions to done', async () => {
    const target = baseRow({
      id: 'se-p2',
      status: 'running',
      step: parallelStep({ order: 3 }),
    })
    const siblings: FakeRow[] = [
      baseRow({ id: 'se-p1', status: 'done', step: parallelStep({ order: 2 }) }),
      target,
      baseRow({
        id: 'se-main',
        status: 'running',
        step: parallelStep({ order: 1, deviceCategory: 'device_main' }),
      }),
    ]
    const { service, emitParallelSyncMock } = makeService(target, { siblings })
    await service.applyTransition({
      stepExecutionId: 'se-p2',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(emitParallelSyncMock).toHaveBeenCalledOnce()
    const payload = emitParallelSyncMock.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      workOrderId: 'wo-1',
      groupId: 'g-dx',
      triggeredByStepExecutionId: 'se-p2',
    })
    expect(typeof payload?.triggeredAt).toBe('string')
  })

  it('emits parallel-sync when a parallel step is skipped and that closes the lane', async () => {
    const target = baseRow({
      id: 'se-p1',
      status: 'blocked',
      step: parallelStep({ order: 2 }),
    })
    const siblings: FakeRow[] = [
      target,
      baseRow({
        id: 'se-p2',
        status: 'done',
        step: parallelStep({ order: 3 }),
      }),
    ]
    const { service, emitParallelSyncMock } = makeService(target, { siblings })
    await service.applyTransition({
      stepExecutionId: 'se-p1',
      workOrderId: 'wo-1',
      event: { type: 'SKIP', by: 'sup-1', reason: 'redo elsewhere' },
      changedBy: 'sup-1',
      plantId: 'plant-1',
    })
    expect(emitParallelSyncMock).toHaveBeenCalledOnce()
    expect(emitParallelSyncMock.mock.calls[0]?.[0]).toMatchObject({
      groupId: 'g-dx',
      triggeredByStepExecutionId: 'se-p1',
    })
  })
})

describe('StepExecutionService.getState', () => {
  it('returns the current state for a step execution', async () => {
    const { service } = makeService(
      baseRow({
        status: 'running',
        startedAt: new Date('2026-04-30T10:00:00Z'),
      }),
    )
    const result = await service.getState('se-1', 'plant-1')
    expect(result.status).toBe('running')
    expect(result.startedAt).toBe('2026-04-30T10:00:00.000Z')
  })

  it('throws NotFound when step execution is not in plant', async () => {
    const { service } = makeService(
      baseRow({ workOrder: { plantId: 'plant-OTHER', deletedAt: null } }),
    )
    await expect(service.getState('se-1', 'plant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})
