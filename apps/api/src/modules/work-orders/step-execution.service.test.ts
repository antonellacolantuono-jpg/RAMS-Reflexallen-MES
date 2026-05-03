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
  /** PROMPT_7 D1 — Step.data JSON column projection. */
  data: string | null
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
  data: string | null
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
  data: null,
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
  data: null,
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

  it('reflects recoveryStage and attemptCount from data JSON', async () => {
    const { service } = makeService(
      baseRow({
        status: 'blocked',
        data: JSON.stringify({ recoveryStage: 'attempt_1', attemptCount: 1 }),
      }),
    )
    const result = await service.getState('se-1', 'plant-1')
    expect(result.recoveryStage).toBe('attempt_1')
    expect(result.attemptCount).toBe(1)
  })
})

// =====================================================================
// D5 — recovery flow + auto-scrap
// =====================================================================

describe('StepExecutionService.applyTransition — recovery flow (D5)', () => {
  it('first COMPLETE_NOK on running stamps recoveryStage=diagnosis, attemptCount=0', async () => {
    const { service, updateMock, recordMock } = makeService(
      baseRow({ status: 'running' }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_NOK', by: 'op-1', causeCode: 'leak_test_fail' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('blocked')
    expect(result.recoveryStage).toBe('diagnosis')
    expect(result.attemptCount).toBe(0)
    expect(result.autoScrapped).toBe(false)
    const updateArg = updateMock.mock.calls[0]?.[0]
    expect(updateArg?.data?.data).toBeTypeOf('string')
    const persisted = JSON.parse(updateArg?.data?.data as string)
    expect(persisted).toEqual({ recoveryStage: 'diagnosis', attemptCount: 0 })
    const audit = recordMock.mock.calls[0]?.[0]
    expect(audit?.after?.recoveryStage).toBe('diagnosis')
  })

  it('RECOVER from blocked increments attemptCount and stage=attempt_1', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'blocked',
        data: JSON.stringify({ recoveryStage: 'diagnosis', attemptCount: 0 }),
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'RECOVER', by: 'op-1', notes: 'reseated fitting' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('recovered')
    expect(result.recoveryStage).toBe('attempt_1')
    expect(result.attemptCount).toBe(1)
    const persisted = JSON.parse(updateMock.mock.calls[0]?.[0]?.data?.data as string)
    expect(persisted).toEqual({ recoveryStage: 'attempt_1', attemptCount: 1 })
  })

  it('Second RECOVER bumps to attempt_2 with attemptCount=2', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'blocked',
        data: JSON.stringify({ recoveryStage: 'attempt_1', attemptCount: 1 }),
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'RECOVER', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.recoveryStage).toBe('attempt_2')
    expect(result.attemptCount).toBe(2)
    const persisted = JSON.parse(updateMock.mock.calls[0]?.[0]?.data?.data as string)
    expect(persisted.attemptCount).toBe(2)
  })

  it('NOK while attemptCount=1 advances stage to attempt_1 (operator failed first retry)', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'running',
        data: JSON.stringify({ recoveryStage: 'attempt_1', attemptCount: 1 }),
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_NOK', by: 'op-1', causeCode: 'still_failing' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('blocked')
    expect(result.recoveryStage).toBe('attempt_1')
    expect(result.attemptCount).toBe(1)
    expect(result.autoScrapped).toBe(false)
    expect(updateMock).toHaveBeenCalledOnce()
  })

  it('MARK_SCRAPPED from blocked persists recoveryStage=scrap', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'blocked',
        data: JSON.stringify({ recoveryStage: 'attempt_2', attemptCount: 2 }),
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'MARK_SCRAPPED', by: 'sup-1', reason: 'physical damage' },
      changedBy: 'sup-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('scrapped')
    expect(result.recoveryStage).toBe('scrap')
    const persisted = JSON.parse(updateMock.mock.calls[0]?.[0]?.data?.data as string)
    expect(persisted.recoveryStage).toBe('scrap')
  })

  it('auto-scrap: COMPLETE_NOK with prior attemptCount=2 chains MARK_SCRAPPED, autoScrapped=true', async () => {
    // After the first applyTransition pass updates the row (running → blocked with
    // attemptCount=2), the recursive call must see status=blocked. We dynamically
    // mutate the FakeRow in the update mock to simulate persistence.
    const row = baseRow({
      status: 'running',
      data: JSON.stringify({ recoveryStage: 'attempt_2', attemptCount: 2 }),
    })
    const updateMock = vi
      .fn()
      .mockImplementation(async (args: { data: { status?: string; data?: string } }) => {
        if (args.data.status) row.status = args.data.status
        if (args.data.data) row.data = args.data.data
        return {}
      })
    const findUniqueMock = vi.fn().mockResolvedValue(row)
    const findFirstMock = vi.fn().mockResolvedValue({ id: row.workOrderId })
    const findManyMock = vi.fn().mockResolvedValue([row])
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
    const events = {
      emitStepTransition: emitMock,
      emitParallelSync: vi.fn(),
    } as unknown as ConstructorParameters<typeof StepExecutionService>[2]
    const service = new StepExecutionService(prisma, auditLog, events)

    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_NOK', by: 'op-1', causeCode: 'final_fail' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('scrapped')
    expect(result.autoScrapped).toBe(true)
    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(recordMock).toHaveBeenCalledTimes(2)
    expect(emitMock).toHaveBeenCalledTimes(2)
    const auditTypes = recordMock.mock.calls.map((c) => c?.[0]?.after?.event)
    expect(auditTypes).toEqual(['COMPLETE_NOK', 'MARK_SCRAPPED'])
  })

  it('RESET clears recoveryStage and attemptCount', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'error',
        data: JSON.stringify({ recoveryStage: 'attempt_2', attemptCount: 2 }),
      }),
    )
    await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'RESET', by: 'sup-1', supervisorId: 'sup-1' },
      changedBy: 'sup-1',
      plantId: 'plant-1',
    })
    const persisted = JSON.parse(updateMock.mock.calls[0]?.[0]?.data?.data as string)
    expect(persisted).toEqual({ recoveryStage: null, attemptCount: 0 })
  })

  it('parseRecoveryData tolerates malformed legacy data and returns defaults', async () => {
    const { service, updateMock } = makeService(
      baseRow({
        status: 'running',
        data: '{not-json',
      }),
    )
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.recoveryStage).toBeNull()
    expect(result.attemptCount).toBe(0)
    // legacy data is replaced by valid JSON on next write
    const persisted = JSON.parse(updateMock.mock.calls[0]?.[0]?.data?.data as string)
    expect(persisted).toEqual({ recoveryStage: null, attemptCount: 0 })
  })
})

describe('StepExecutionService.findStepsForWorkOrder — recovery payload (D5)', () => {
  it('exposes recoveryStage and attemptCount on each step DTO', async () => {
    const { service } = makeService(
      baseRow({
        status: 'blocked',
        data: JSON.stringify({ recoveryStage: 'attempt_2', attemptCount: 2 }),
      }),
    )
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(result[0]).toMatchObject({
      recoveryStage: 'attempt_2',
      attemptCount: 2,
    })
  })
})

// =====================================================================
// PROMPT_9 — Tool wear hook + block-on-exceeded guard
// =====================================================================

describe('StepExecutionService — tool wear hook (PROMPT_9)', () => {
  type FakeTool = {
    id: string
    code: string
    currentCyclesCount: number
    maxCycles: number | null
    wearStatus: string
  }
  type FakeStepWithTool = FakeStep & { tool?: FakeTool | null; toolId?: string | null }

  function makeRowWithTool(tool: FakeTool | null, status: string = 'pending'): FakeRow {
    const step: FakeStepWithTool = makeStep({
      category: 'production',
      actionType: 'manual_operation',
    })
    step.tool = tool
    step.toolId = tool?.id ?? null
    return baseRow({ status, step })
  }

  function makeServiceWithTools(row: FakeRow, toolsServiceImpl: { recordCycle: ReturnType<typeof vi.fn> } | null) {
    const updateMock = vi.fn().mockResolvedValue({})
    const findUniqueMock = vi.fn().mockResolvedValue(row)
    const findFirstMock = vi.fn().mockResolvedValue({ id: row.workOrderId })
    const findManyMock = vi.fn().mockResolvedValue([row])
    const prisma = {
      stepExecution: { findUnique: findUniqueMock, findMany: findManyMock, update: updateMock },
      workOrder: { findFirst: findFirstMock },
    } as unknown as ConstructorParameters<typeof StepExecutionService>[0]
    const auditLog = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ConstructorParameters<typeof StepExecutionService>[1]
    const events = {
      emitStepTransition: vi.fn(),
      emitParallelSync: vi.fn(),
    } as unknown as ConstructorParameters<typeof StepExecutionService>[2]
    // Pass null mock dispatcher + the (optional) tools service in the 5th slot.
    const service = new StepExecutionService(
      prisma,
      auditLog,
      events,
      null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toolsServiceImpl as any,
    )
    return { service, updateMock }
  }

  it('blocks START with UnprocessableEntity when bound tool is exceeded', async () => {
    const row = makeRowWithTool(
      { id: 'tool-1', code: 'TOOL-CRIMP-8MM', currentCyclesCount: 1000, maxCycles: 1000, wearStatus: 'at_limit' },
      'pending',
    )
    const { service } = makeServiceWithTools(row, null)
    await expect(
      service.applyTransition({
        stepExecutionId: 'se-1',
        workOrderId: 'wo-1',
        event: { type: 'START', by: 'op-1' },
        changedBy: 'op-1',
        plantId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it('allows START when tool exists but is not exceeded', async () => {
    const row = makeRowWithTool(
      { id: 'tool-1', code: 'TOOL-CRIMP-8MM', currentCyclesCount: 950, maxCycles: 1000, wearStatus: 'at_limit' },
      'pending',
    )
    const recordCycle = vi.fn().mockResolvedValue(undefined)
    const { service, updateMock } = makeServiceWithTools(row, { recordCycle })
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'START', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('running')
    expect(updateMock).toHaveBeenCalledOnce()
    // recordCycle should NOT fire on START — only on done
    expect(recordCycle).not.toHaveBeenCalled()
  })

  it('calls toolsService.recordCycle when tool-bearing step lands in done', async () => {
    const row = makeRowWithTool(
      { id: 'tool-1', code: 'TOOL-CRIMP-8MM', currentCyclesCount: 5, maxCycles: 1000, wearStatus: 'good' },
      'running',
    )
    const recordCycle = vi.fn().mockResolvedValue(undefined)
    const { service } = makeServiceWithTools(row, { recordCycle })
    await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(recordCycle).toHaveBeenCalledOnce()
    expect(recordCycle).toHaveBeenCalledWith('tool-1', 'op-1', 'plant-1')
  })

  it('does not call recordCycle when step has no tool', async () => {
    const row = makeRowWithTool(null, 'running')
    const recordCycle = vi.fn().mockResolvedValue(undefined)
    const { service } = makeServiceWithTools(row, { recordCycle })
    const result = await service.applyTransition({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      event: { type: 'COMPLETE_OK', by: 'op-1' },
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(result.toStatus).toBe('done')
    expect(recordCycle).not.toHaveBeenCalled()
  })
})

describe('StepExecutionService.findStepsForWorkOrder — Step.data projection (PROMPT_7 D1)', () => {
  it('projects parsed Step.data JSON onto the DTO', async () => {
    const stepDataJson = JSON.stringify({
      recoveryConfig: {
        enabled: true,
        maxAttempts: 2,
        preRetryStepIds: ['step-recovery-check', 'step-recovery-clean'],
      },
      photoUrl: '/uploads/leak.png',
      actionType: 'device_run',
    })
    const { service } = makeService(
      baseRow({
        step: makeStep({ data: stepDataJson }),
      }),
    )
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(result[0]?.data).toEqual({
      recoveryConfig: {
        enabled: true,
        maxAttempts: 2,
        preRetryStepIds: ['step-recovery-check', 'step-recovery-clean'],
      },
      photoUrl: '/uploads/leak.png',
      actionType: 'device_run',
    })
  })

  it('returns data: null when Step.data is null (backward-compat)', async () => {
    const { service } = makeService(baseRow({ step: makeStep({ data: null }) }))
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(result[0]?.data).toBeNull()
  })

  it('returns data: null when Step.data is malformed JSON (defensive)', async () => {
    const { service } = makeService(
      baseRow({ step: makeStep({ data: '{not even close' }) }),
    )
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(result[0]?.data).toBeNull()
  })

  it('returns data: null when Step.data is a JSON array (object expected)', async () => {
    const { service } = makeService(
      baseRow({ step: makeStep({ data: JSON.stringify([1, 2, 3]) }) }),
    )
    const result = await service.findStepsForWorkOrder('wo-1', 'plant-1')
    expect(result[0]?.data).toBeNull()
  })
})
