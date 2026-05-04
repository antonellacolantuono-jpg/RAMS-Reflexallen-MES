import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common'
import { createActor } from 'xstate'
import {
  isParallelSyncTrigger,
  stepExecutionMachine,
  MAX_RECOVERY_ATTEMPTS,
  type ParallelStepWithStatus,
  type RecoveryStage,
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
import {
  MockDeviceDispatcherService,
  type DispatchOutcomeContext,
} from '../mock-devices/mock-device-dispatcher.service'
import { ToolsService, isToolExceeded } from '../tools/tools.service'

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
  recoveryStage: RecoveryStage | null
  attemptCount: number
  autoScrapped: boolean
}

export interface RecoveryDataPayload {
  recoveryStage: RecoveryStage | null
  attemptCount: number
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
  recoveryStage: RecoveryStage | null
  attemptCount: number
}

export interface WorkOrderStepDto extends StepStateDto {
  stepName: string
  stepCategory: string
  stepOrder: number
  actionType: string
  instructions: string | null
  deviceCategory: string | null
  /**
   * PNE_4_FOCUSED D1 — projected from `Step.device.serialNumber` so the HMI
   * generic step view can pick the right device-cycle telemetry subview (leak
   * pressure, camera ROI grid, crimp force) and so step-execution dispatch
   * (D2, closes TODO-043) can route to the matching mock simulator. `null`
   * when the step has no device link or the device has no serial number.
   */
  deviceSerialNumber: string | null
  groupId: string
  groupName: string
  groupCategory: string
  groupSupportsParallel: boolean
  recoveryStage: RecoveryStage | null
  attemptCount: number
  /**
   * PROMPT_7 D1 — polymorphic step data projection from `Step.data` JSON
   * column. Parsed server-side so HMI can read `step.data.recoveryConfig` /
   * `step.data.photoUrl` directly without re-parsing. Returns `null` when
   * the column is null OR when the JSON failed to parse (defensive).
   */
  data: Record<string, unknown> | null
  /**
   * PROMPT_9 — tool wear projection. `toolId` is the bound tool (if any);
   * `toolWearStatus` is the cached enum (`new|good|worn|at_limit|replaced`);
   * `toolIsExceeded` is the derived predicate (currentCyclesCount ≥ maxCycles).
   * HMI uses these to render wear badges and disable START on exceeded tools.
   */
  toolId: string | null
  toolWearStatus: string | null
  toolIsExceeded: boolean
  /**
   * PROMPT_15 — Work Unit (Postazione) where the operator performs this step.
   * Hydrated from the Step.workUnitId FK so HMI can render "Postazione: WU-XXX"
   * on the step card without a follow-up query. Null when no work unit is set.
   */
  workUnitId: string | null
  workUnit: { id: string; code: string; name: string } | null
}

/**
 * PROMPT_7 D1 — defensive JSON parse for Step.data column.
 * Returns the parsed object on success, `null` on missing/malformed input.
 * Mirrors the parseStepData helper on the web side (WorkflowCanvas) so
 * the contract is identical at both ends of the pipe.
 */
function parseStepDataJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

@Injectable()
export class StepExecutionService {
  private readonly logger = new Logger(StepExecutionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly events: WorkOrderEventsGateway,
    /**
     * PNE_4_FOCUSED D2 — optional MockDeviceDispatcher (closes TODO-043).
     * `@Optional` so unit tests that don't register MockDevicesModule still
     * work — when missing, dispatch is a silent no-op. `forwardRef` because
     * MockDevicesModule and WorkOrdersModule each import the other.
     */
    @Optional()
    @Inject(forwardRef(() => MockDeviceDispatcherService))
    private readonly mockDeviceDispatcher: MockDeviceDispatcherService | null = null,
    /**
     * PROMPT_9 — ToolsService injected as Optional so unit tests that don't
     * register ToolsModule still construct the service. When present, we call
     * `recordCycle` on every tool-bearing step that lands in `done`, and check
     * `isToolExceeded` to block START transitions on worn-out tooling.
     */
    @Optional()
    private readonly toolsService: ToolsService | null = null,
  ) {
    // Register the outcome listener once. The dispatcher fires this when a
    // simulator finishes its cycle; we translate the outcome into the matching
    // state-machine transition (COMPLETE_OK for PASS/MARGINAL,
    // COMPLETE_NOK for FAIL).
    this.mockDeviceDispatcher?.onOutcome((ctx) => this.handleDispatchOutcome(ctx))
  }

  private async handleDispatchOutcome(ctx: DispatchOutcomeContext): Promise<void> {
    const eventType = ctx.outcome === 'FAIL' ? 'COMPLETE_NOK' : 'COMPLETE_OK'
    const event =
      eventType === 'COMPLETE_NOK'
        ? {
            type: eventType,
            by: ctx.changedBy,
            causeCode: 'auto_device_fail',
          }
        : { type: eventType, by: ctx.changedBy }
    try {
      await this.applyTransition({
        stepExecutionId: ctx.stepExecutionId,
        workOrderId: ctx.workOrderId,
        event,
        changedBy: ctx.changedBy,
        plantId: ctx.plantId,
      })
    } catch (err) {
      // Operator may have manually advanced the step before the simulator
      // finished — applyTransition's state-machine guard rejects, surface as
      // a warning so demo logs stay clean.
      this.logger.warn(
        `auto-dispatch ${eventType} failed for step ${ctx.stepExecutionId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

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
      include: {
        step: {
          include: { group: true, device: true, tool: true, workUnit: true },
        },
      },
      orderBy: { step: { order: 'asc' } },
    })
    return rows.map((r) => {
      const recovery = this.parseRecoveryData(r.data ?? null)
      // PROMPT_9 — surface tool wear info on the DTO for HMI badges.
      const tool = (r.step as { tool?: { id: string; currentCyclesCount: number; maxCycles: number | null; wearStatus: string } | null }).tool ?? null
      // PROMPT_15 — surface workUnit (Postazione) for HMI step header.
      const workUnit = (r.step as { workUnit?: { id: string; code: string; name: string } | null }).workUnit ?? null
      return {
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
        deviceCategory: r.step.deviceCategory ?? null,
        deviceSerialNumber: r.step.device?.serialNumber ?? null,
        groupId: r.step.groupId,
        groupName: r.step.group.name,
        groupCategory: r.step.group.category,
        groupSupportsParallel: r.step.group.supportsParallel,
        recoveryStage: recovery.recoveryStage,
        attemptCount: recovery.attemptCount,
        // PROMPT_7 D1 — parse Step.data JSON server-side; null on missing or
        // malformed payload (never throws — see parseStepDataJson helper).
        data: parseStepDataJson(r.step.data ?? null),
        toolId: tool?.id ?? null,
        toolWearStatus: tool?.wearStatus ?? null,
        toolIsExceeded: tool ? isToolExceeded({ currentCyclesCount: tool.currentCyclesCount, maxCycles: tool.maxCycles }) : false,
        workUnitId: r.step.workUnitId ?? null,
        workUnit: workUnit ? { id: workUnit.id, code: workUnit.code, name: workUnit.name } : null,
      }
    })
  }

  async getState(
    stepExecutionId: string,
    plantId: string,
  ): Promise<StepStateDto> {
    const row = await this.loadOrThrow(stepExecutionId, plantId)
    const recovery = this.parseRecoveryData(row.data ?? null)
    return {
      stepExecutionId: row.id,
      workOrderId: row.workOrderId,
      stepId: row.stepId,
      status: (row.status as StepExecutionStatus) ?? 'pending',
      result: row.result ?? null,
      durationSec: row.durationSec ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      recoveryStage: recovery.recoveryStage,
      attemptCount: recovery.attemptCount,
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

    // PROMPT_9 — block START on a step bound to an exceeded tool. The check
    // runs BEFORE the state-machine guard so we surface a clear domain error
    // ("Tool exceeded; replace before use") rather than a generic invalid
    // transition. Only START is gated — recovery flows and supervisor
    // overrides remain free to advance the row.
    if (event.type === 'START' && fromStatus === 'pending') {
      const tool = (row.step as { tool?: { code: string; currentCyclesCount: number; maxCycles: number | null } | null }).tool
      if (tool && isToolExceeded(tool)) {
        throw new UnprocessableEntityException(
          `Tool ${tool.code} exceeded lifetime (${tool.currentCyclesCount}/${tool.maxCycles ?? '∞'}); replace before use`,
        )
      }
    }

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

    const priorRecovery = this.parseRecoveryData(row.data ?? null)
    const updatedRecovery = this.deriveRecoveryState(
      fromStatus,
      toStatus,
      event.type,
      priorRecovery,
    )

    await this.prisma.stepExecution.update({
      where: { id: row.id },
      data: {
        status: toStatus,
        result: result ?? row.result,
        durationSec: newCtx.elapsedSec || row.durationSec,
        notes: this.serializeNotes(newCtx.notes),
        data: this.serializeRecoveryData(updatedRecovery),
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
        recoveryStage: updatedRecovery.recoveryStage,
        attemptCount: updatedRecovery.attemptCount,
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

    // PROMPT_9 — auto-increment tool wear when a tool-bearing step lands in
    // `done`. Errors are logged but do NOT roll back the transition (the step
    // is already persisted; wear accounting is best-effort). Only triggered
    // when ToolsService is wired (Optional injection — unit tests skip this).
    if (toStatus === 'done' && this.toolsService) {
      const tool = (row.step as { tool?: { id: string } | null }).tool
      if (tool?.id) {
        try {
          await this.toolsService.recordCycle(tool.id, req.changedBy, req.plantId)
        } catch (err) {
          this.logger.warn(
            `tool wear recordCycle failed for tool ${tool.id} on step ${row.id}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          )
        }
      }
    }

    await this.maybeEmitParallelSync({
      stepExecutionId: row.id,
      stepId: row.stepId,
      groupId: row.step.groupId,
      groupSupportsParallel: row.step.group.supportsParallel,
      deviceCategory: row.step.deviceCategory ?? null,
      toStatus,
      workOrderId: row.workOrderId,
      changedAt,
    })

    // PNE_4_FOCUSED D2 — closes TODO-043. After a START transition lands a
    // step in `running` AND the step is a `device_run` action (with a known
    // mock device serial under DEMO_MODE), kick off the matching simulator.
    // The dispatcher will fire a follow-up COMPLETE_OK / COMPLETE_NOK via its
    // outcome listener (registered in the constructor) when the simulator
    // finishes its cycle. Real devices fall through to no-op (the dispatcher
    // returns false from canDispatch).
    if (
      fromStatus === 'pending' &&
      toStatus === 'running' &&
      event.type === 'START' &&
      row.step.actionType === 'device_run' &&
      row.step.device?.serialNumber &&
      this.mockDeviceDispatcher
    ) {
      this.mockDeviceDispatcher.dispatch({
        stepExecutionId: row.id,
        workOrderId: row.workOrderId,
        deviceSerialNumber: row.step.device.serialNumber,
        // Recipe parameters live on RecipeVersion (not Recipe directly) and
        // would require an extra Prisma query to resolve. The 3 mock
        // simulators have hardcoded defaults that match the PNE_2-seeded
        // recipes (RCP-LEAK-PNE-12-001 v2 / RCP-CAMERA-PNE-001 v1 /
        // RCP-CRIMP-12-001 v1), so passing an empty object is sufficient
        // for the demo. Real-device dispatch in F2 will resolve via
        // RecipeVersion lookup.
        recipeParams: {},
        // Identity fallback (Lesson 56): the simulator's onComplete fires
        // asynchronously without a request context, so we capture changedBy /
        // plantId from the current request and reuse them. If those happen to
        // be empty (DEMO_MODE without auth), fall back to the env values
        // that FastForwardController already uses.
        changedBy: req.changedBy || process.env['DEMO_USER_ID'] || 'demo-user',
        plantId: req.plantId || process.env['DEMO_PLANT_ID'] || '',
      })
    }

    // Auto-scrap rule (D5): when COMPLETE_NOK lands on `blocked` AND the step
    // has already exhausted MAX_RECOVERY_ATTEMPTS recovery cycles, chain a
    // MARK_SCRAPPED transition. Audit + emit fire for both transitions so the
    // operator sees the final scrapped state and the trail is preserved.
    if (
      toStatus === 'blocked' &&
      event.type === 'COMPLETE_NOK' &&
      priorRecovery.attemptCount >= MAX_RECOVERY_ATTEMPTS
    ) {
      const scrapResult = await this.applyTransition({
        stepExecutionId: req.stepExecutionId,
        workOrderId: req.workOrderId,
        event: {
          type: 'MARK_SCRAPPED',
          by: req.changedBy,
          reason: 'auto_scrap_max_attempts',
        },
        changedBy: req.changedBy,
        plantId: req.plantId,
      })
      return { ...scrapResult, autoScrapped: true }
    }

    return {
      stepExecutionId: row.id,
      workOrderId: row.workOrderId,
      fromStatus,
      toStatus,
      event: event.type,
      changedAt,
      notes: newCtx.notes,
      causeCode: newCtx.causeCode,
      recoveryStage: updatedRecovery.recoveryStage,
      attemptCount: updatedRecovery.attemptCount,
      autoScrapped: false,
    }
  }

  private async maybeEmitParallelSync(input: {
    stepExecutionId: string
    stepId: string
    groupId: string
    groupSupportsParallel: boolean
    deviceCategory: string | null
    toStatus: StepExecutionStatus
    workOrderId: string
    changedAt: string
  }): Promise<void> {
    if (!input.groupSupportsParallel) return
    if (input.deviceCategory !== 'parallel') return

    const siblings = await this.prisma.stepExecution.findMany({
      where: { workOrderId: input.workOrderId, step: { groupId: input.groupId } },
      include: { step: { select: { order: true, deviceCategory: true } } },
    })

    const groupSteps: ParallelStepWithStatus[] = siblings.map((s) => ({
      id: s.id === input.stepExecutionId ? input.stepExecutionId : s.id,
      order: s.step.order,
      deviceCategory: (s.step.deviceCategory ?? null) as ParallelStepWithStatus['deviceCategory'],
      status:
        s.id === input.stepExecutionId
          ? input.toStatus
          : ((s.status as StepExecutionStatus) ?? 'pending'),
    }))

    const transitioned: ParallelStepWithStatus = {
      id: input.stepExecutionId,
      order: 0,
      deviceCategory: 'parallel',
      status: input.toStatus,
    }

    if (!isParallelSyncTrigger(transitioned, groupSteps)) return

    this.events.emitParallelSync({
      workOrderId: input.workOrderId,
      groupId: input.groupId,
      triggeredByStepExecutionId: input.stepExecutionId,
      triggeredAt: input.changedAt,
    })
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

  /**
   * Reads `recoveryStage` and `attemptCount` from the StepExecution.data JSON
   * column. Tolerant of missing fields and legacy form-data payloads (e.g.,
   * scan results) by returning defaults when absent.
   */
  private parseRecoveryData(raw: string | null): RecoveryDataPayload {
    if (!raw) return { recoveryStage: null, attemptCount: 0 }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const stage = parsed['recoveryStage']
      const count = parsed['attemptCount']
      return {
        recoveryStage: this.coerceRecoveryStage(stage),
        attemptCount: typeof count === 'number' && Number.isFinite(count) ? count : 0,
      }
    } catch {
      return { recoveryStage: null, attemptCount: 0 }
    }
  }

  private serializeRecoveryData(payload: RecoveryDataPayload): string {
    return JSON.stringify(payload)
  }

  private coerceRecoveryStage(value: unknown): RecoveryStage | null {
    if (
      value === 'diagnosis' ||
      value === 'attempt_1' ||
      value === 'attempt_2' ||
      value === 'scrap' ||
      value === 'recovered'
    ) {
      return value
    }
    return null
  }

  /**
   * Computes new recovery state given the transition just executed.
   *
   * Rules:
   *   running → blocked (COMPLETE_NOK):
   *     - If no prior recovery, mark stage = diagnosis (operator deciding).
   *     - If a recovery cycle was in flight (attemptCount > 0), the failure
   *       advances the stage to attempt_N (matching the count). Auto-scrap
   *       is enforced by the caller when attemptCount >= MAX.
   *   blocked → recovered (RECOVER):
   *     - Increment attemptCount; stage tracks the upcoming retry slot.
   *   * → scrapped (MARK_SCRAPPED): stage = scrap.
   *   pending/* → running on RESET: clear recovery state.
   */
  private deriveRecoveryState(
    from: StepExecutionStatus,
    to: StepExecutionStatus,
    eventType: string,
    prior: RecoveryDataPayload,
  ): RecoveryDataPayload {
    if (to === 'scrapped') {
      return { recoveryStage: 'scrap', attemptCount: prior.attemptCount }
    }

    if (to === 'blocked' && eventType === 'COMPLETE_NOK') {
      if (prior.attemptCount === 0) {
        return { recoveryStage: 'diagnosis', attemptCount: 0 }
      }
      const stage: RecoveryStage =
        prior.attemptCount === 1 ? 'attempt_1' : 'attempt_2'
      return { recoveryStage: stage, attemptCount: prior.attemptCount }
    }

    if (from === 'blocked' && to === 'recovered' && eventType === 'RECOVER') {
      const next = prior.attemptCount + 1
      const stage: RecoveryStage = next === 1 ? 'attempt_1' : 'attempt_2'
      return { recoveryStage: stage, attemptCount: next }
    }

    if (eventType === 'RESET') {
      return { recoveryStage: null, attemptCount: 0 }
    }

    return prior
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
        // PNE_4_FOCUSED D2 — also load device so the dispatch trigger (after
        // START on a device_main step) can read the device serial without an
        // extra query. Recipe params resolution lives on RecipeVersion (not
        // Recipe directly) and the 3 mock simulators have hardcoded defaults
        // matching the PNE_2-seeded recipes — no recipe lookup needed for the
        // demo. Real-device dispatch in F2 will resolve via RecipeVersion.
        // PROMPT_9 — also include `tool` so applyTransition can run the
        // wear-block guard on START and trigger recordCycle on done.
        step: { include: { group: true, device: true, tool: true } },
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

