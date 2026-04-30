import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { createActor } from 'xstate'
import {
  stepExecutionMachine,
  type StepExecutionContext,
  type StepExecutionEvent,
  type StepExecutionStatus,
} from '@mes/domain'
import {
  StepExecutionEventSchema,
  type StepExecutionEventInput,
} from '@mes/schemas'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { WorkOrderEventsGateway } from '../events/work-order-events.gateway'

export interface TransitionRequest {
  stepExecutionId: string
  workOrderId: string
  event: unknown
  changedBy: string
  plantId: string
}

export interface TransitionResult {
  stepExecutionId: string
  workOrderId: string
  fromStatus: StepExecutionStatus
  toStatus: StepExecutionStatus
  event: string
  changedAt: string
  notes: string[]
  causeCode: string | null
}

export interface StepStateDto {
  stepExecutionId: string
  workOrderId: string
  stepId: string
  status: StepExecutionStatus
  result: string | null
  durationSec: number | null
  startedAt: string | null
  completedAt: string | null
}

export interface WorkOrderStepDto extends StepStateDto {
  stepName: string
  stepCategory: string
  stepOrder: number
  actionType: string
  instructions: string | null
}

@Injectable()
export class StepExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly events: WorkOrderEventsGateway,
  ) {}

  async findStepsForWorkOrder(
    workOrderId: string,
    plantId: string,
  ): Promise<WorkOrderStepDto[]> {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, plantId, deletedAt: null },
      select: { id: true },
    })
    if (!wo) {
      throw new NotFoundException('Work order not found')
    }
    const rows = await this.prisma.stepExecution.findMany({
      where: { workOrderId },
      include: { step: true },
      orderBy: { step: { order: 'asc' } },
    })
    return rows.map((r) => ({
      stepExecutionId: r.id,
      workOrderId: r.workOrderId,
      stepId: r.stepId,
      status: (r.status as StepExecutionStatus) ?? 'pending',
      result: r.result ?? null,
      durationSec: r.durationSec ?? null,
      startedAt: r.startedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      stepName: r.step.name,
      stepCategory: r.step.category,
      stepOrder: r.step.order,
      actionType: r.step.actionType,
      instructions: r.step.instructions ?? null,
    }))
  }

  async getState(
    stepExecutionId: string,
    plantId: string,
  ): Promise<StepStateDto> {
    const row = await this.loadOrThrow(stepExecutionId, plantId)
    return {
      stepExecutionId: row.id,
      workOrderId: row.workOrderId,
      stepId: row.stepId,
      status: (row.status as StepExecutionStatus) ?? 'pending',
      result: row.result ?? null,
      durationSec: row.durationSec ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
    }
  }

  async applyTransition(req: TransitionRequest): Promise<TransitionResult> {
    const parsed = StepExecutionEventSchema.safeParse(req.event)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const inputEvent = parsed.data

    const row = await this.loadOrThrow(req.stepExecutionId, req.plantId)
    if (row.workOrderId !== req.workOrderId) {
      throw new NotFoundException('Step execution not found for work order')
    }

    const fromStatus = (row.status as StepExecutionStatus) ?? 'pending'
    const event: StepExecutionEvent = this.applyDefaultBy(
      inputEvent,
      req.changedBy,
    )

    const persistedNotes = this.parseNotes(row.notes)
    const restored = this.buildRestored(
      {
        stepExecutionId: row.id,
        workOrderId: row.workOrderId,
        stepId: row.stepId,
        stepCategory: row.step.category,
        operatorId: row.operatorId ?? null,
        by: req.changedBy,
      },
      fromStatus,
      {
        operatorId: row.operatorId ?? null,
        startedAt: row.startedAt ? row.startedAt.toISOString() : null,
        elapsedSec: row.durationSec ?? 0,
        notes: persistedNotes,
        causeCode: null,
        errorCode: null,
        errorMessage: null,
      },
    )

    if (!restored.getSnapshot().can(event)) {
      restored.stop()
      throw new UnprocessableEntityException(
        `Event ${event.type} is not valid in state ${fromStatus}`,
      )
    }

    restored.send(event)
    const snap = restored.getSnapshot()
    const toStatus = snap.value as StepExecutionStatus
    const newCtx = snap.context
    restored.stop()

    const result = this.deriveResult(event.type, fromStatus, toStatus)
    const completedAt = this.deriveCompletedAt(toStatus)
    const startedAt = this.deriveStartedAt(fromStatus, toStatus, row.startedAt)

    await this.prisma.stepExecution.update({
      where: { id: row.id },
      data: {
        status: toStatus,
        result: result ?? row.result,
        durationSec: newCtx.elapsedSec || row.durationSec,
        notes: this.serializeNotes(newCtx.notes),
        startedAt: startedAt,
        completedAt,
        operatorId: newCtx.operatorId ?? row.operatorId,
      },
    })

    const changedAt = new Date().toISOString()

    await this.auditLog.record({
      entityType: 'StepExecution',
      entityId: row.id,
      action: 'state_change',
      changedBy: req.changedBy,
      plantId: req.plantId,
      before: { status: fromStatus },
      after: {
        status: toStatus,
        event: event.type,
        payload: event,
      },
    })

    this.events.emitStepTransition({
      workOrderId: row.workOrderId,
      stepExecutionId: row.id,
      stepId: row.stepId,
      fromStatus,
      toStatus,
      event: event.type,
      changedBy: req.changedBy,
      changedAt,
    })

    return {
      stepExecutionId: row.id,
      workOrderId: row.workOrderId,
      fromStatus,
      toStatus,
      event: event.type,
      changedAt,
      notes: newCtx.notes,
      causeCode: newCtx.causeCode,
    }
  }

  private applyDefaultBy(
    event: StepExecutionEventInput,
    changedBy: string,
  ): StepExecutionEvent {
    if ('by' in event && event.by) return event as StepExecutionEvent
    if (event.type === 'TICK') return event as StepExecutionEvent
    return { ...event, by: changedBy } as StepExecutionEvent
  }

  private buildRestored(
    input: {
      stepExecutionId: string
      workOrderId: string
      stepId: string
      stepCategory: string
      operatorId: string | null
      by: string
    },
    currentStatus: StepExecutionStatus,
    contextOverrides: Partial<StepExecutionContext>,
  ) {
    const base = createActor(stepExecutionMachine, { input })
    base.start()
    const blank = base.getPersistedSnapshot() as unknown as {
      value: StepExecutionStatus
      context: StepExecutionContext
    }
    base.stop()
    const patched = {
      ...blank,
      value: currentStatus,
      context: {
        ...blank.context,
        ...contextOverrides,
      },
    }
    // XState v5 accepts { snapshot } to restore an actor in a specific state.
    // The TS overload doesn't expose this in a friendly way, so we cast.
    const opts = { input, snapshot: patched } as never
    const restored = createActor(stepExecutionMachine, opts)
    restored.start()
    return restored
  }

  private parseNotes(raw: string | null | undefined): string[] {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : []
    } catch {
      return raw.length > 0 ? [raw] : []
    }
  }

  private serializeNotes(notes: string[]): string {
    return JSON.stringify(notes)
  }

  private deriveResult(
    eventType: StepExecutionEvent['type'],
    _from: StepExecutionStatus,
    to: StepExecutionStatus,
  ): string | null {
    if (to === 'done') return 'ok'
    if (to === 'blocked' && eventType === 'COMPLETE_NOK') return 'nok'
    if (to === 'skipped') return 'skipped'
    if (to === 'scrapped') return 'scrap'
    if (to === 'recovered') return 'rework'
    return null
  }

  private deriveCompletedAt(to: StepExecutionStatus): Date | null {
    if (to === 'done' || to === 'skipped' || to === 'cancelled') {
      return new Date()
    }
    return null
  }

  private deriveStartedAt(
    from: StepExecutionStatus,
    to: StepExecutionStatus,
    existing: Date | null | undefined,
  ): Date {
    if (existing) return existing
    if (from === 'pending' && to === 'running') return new Date()
    return existing ?? new Date()
  }

  private async loadOrThrow(stepExecutionId: string, plantId: string) {
    const row = await this.prisma.stepExecution.findUnique({
      where: { id: stepExecutionId },
      include: {
        step: true,
        workOrder: { select: { plantId: true, deletedAt: true } },
      },
    })
    if (!row) throw new NotFoundException('Step execution not found')
    if (row.workOrder.deletedAt !== null || row.workOrder.plantId !== plantId) {
      throw new NotFoundException('Step execution not found')
    }
    return row
  }
}
