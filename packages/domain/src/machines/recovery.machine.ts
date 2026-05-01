import { createMachine, assign } from 'xstate'

/**
 * Recovery flow (D5 of PROMPT_5_FULL):
 *
 * When a step transitions to `blocked` in the parent step-execution machine,
 * a recovery flow guides the operator through up to 4 stages before scrap:
 *
 *   diagnosis → attempt_1 → attempt_2 → scrap
 *
 * Stages and transitions:
 *   diagnosis  ─BEGIN_ATTEMPT────────→ attempt_1
 *   diagnosis  ─SCRAP─────────────────→ scrap
 *   attempt_1  ─ATTEMPT_OK────────────→ recovered  (terminal-success)
 *   attempt_1  ─ATTEMPT_NOK───────────→ attempt_2
 *   attempt_1  ─SCRAP─────────────────→ scrap      (operator may scrap directly)
 *   attempt_2  ─ATTEMPT_OK────────────→ recovered
 *   attempt_2  ─ATTEMPT_NOK───────────→ scrap      (auto: max attempts reached)
 *   attempt_2  ─SCRAP─────────────────→ scrap
 *   scrap      ─(final)
 *   recovered  ─(final)
 *
 * Business rule: after 2 failed attempts, the lot/piece is automatically
 * scrapped. The operator cannot retry beyond attempt_2.
 *
 * This machine is a pure-domain state machine; persistence is done by the
 * parent step-execution.service which keeps `recoveryStage` + `attemptCount`
 * in `StepExecution.data` (JSON column, no schema change).
 */

export type RecoveryStage =
  | 'diagnosis'
  | 'attempt_1'
  | 'attempt_2'
  | 'scrap'
  | 'recovered'

export const MAX_RECOVERY_ATTEMPTS = 2

export interface RecoveryContext {
  stepExecutionId: string
  workOrderId: string
  causeCode: string | null
  attemptCount: number
  notes: string[]
  lastTransitionAt: string
  lastTransitionBy: string
  diagnosisNotes: string | null
  scrapReason: string | null
}

export type RecoveryEvent =
  | { type: 'BEGIN_ATTEMPT'; by: string; diagnosisNotes?: string }
  | { type: 'ATTEMPT_OK'; by: string; notes?: string }
  | { type: 'ATTEMPT_NOK'; by: string; notes?: string }
  | { type: 'SCRAP'; by: string; reason: string }
  | { type: 'RECORD_NOTE'; by: string; note: string }

export interface RecoveryInput {
  stepExecutionId: string
  workOrderId: string
  causeCode?: string | null
  by: string
  attemptCount?: number
}

function now(): string {
  return new Date().toISOString()
}

export const recoveryMachine = createMachine({
  id: 'recovery',
  types: {
    context: {} as RecoveryContext,
    events: {} as RecoveryEvent,
  },
  initial: 'diagnosis',
  context: ({ input }: { input: RecoveryInput }) => ({
    stepExecutionId: input.stepExecutionId,
    workOrderId: input.workOrderId,
    causeCode: input.causeCode ?? null,
    attemptCount: input.attemptCount ?? 0,
    notes: [],
    lastTransitionAt: now(),
    lastTransitionBy: input.by,
    diagnosisNotes: null,
    scrapReason: null,
  }),
  states: {
    diagnosis: {
      on: {
        BEGIN_ATTEMPT: {
          target: 'attempt_1',
          actions: assign(({ context, event }) => ({
            attemptCount: 1,
            diagnosisNotes: event.diagnosisNotes ?? context.diagnosisNotes,
            notes: event.diagnosisNotes
              ? [...context.notes, `diagnosis: ${event.diagnosisNotes}`]
              : context.notes,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        SCRAP: {
          target: 'scrap',
          actions: assign(({ context, event }) => ({
            scrapReason: event.reason,
            notes: [...context.notes, `scrap_at_diagnosis: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        RECORD_NOTE: {
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, event.note],
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    attempt_1: {
      on: {
        ATTEMPT_OK: {
          target: 'recovered',
          actions: assign(({ context, event }) => ({
            notes: event.notes
              ? [...context.notes, `attempt_1_ok: ${event.notes}`]
              : context.notes,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ATTEMPT_NOK: {
          target: 'attempt_2',
          actions: assign(({ context, event }) => ({
            attemptCount: 2,
            notes: event.notes
              ? [...context.notes, `attempt_1_nok: ${event.notes}`]
              : [...context.notes, 'attempt_1_nok'],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        SCRAP: {
          target: 'scrap',
          actions: assign(({ context, event }) => ({
            scrapReason: event.reason,
            notes: [...context.notes, `scrap_at_attempt_1: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        RECORD_NOTE: {
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, event.note],
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    attempt_2: {
      on: {
        ATTEMPT_OK: {
          target: 'recovered',
          actions: assign(({ context, event }) => ({
            notes: event.notes
              ? [...context.notes, `attempt_2_ok: ${event.notes}`]
              : context.notes,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ATTEMPT_NOK: {
          target: 'scrap',
          actions: assign(({ context, event }) => ({
            scrapReason: event.notes ?? 'auto_scrap_max_attempts',
            notes: event.notes
              ? [...context.notes, `attempt_2_nok_auto_scrap: ${event.notes}`]
              : [...context.notes, 'attempt_2_nok_auto_scrap'],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        SCRAP: {
          target: 'scrap',
          actions: assign(({ context, event }) => ({
            scrapReason: event.reason,
            notes: [...context.notes, `scrap_at_attempt_2: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        RECORD_NOTE: {
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, event.note],
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    recovered: {
      type: 'final',
    },

    scrap: {
      type: 'final',
    },
  },
})

/**
 * Returns the next recovery stage given the current stage + last attempt
 * outcome, without instantiating an actor. Used by the API service to update
 * `StepExecution.data.recoveryStage` after a transition.
 */
export function nextRecoveryStage(
  current: RecoveryStage,
  outcome: 'begin' | 'ok' | 'nok' | 'scrap',
): RecoveryStage {
  if (outcome === 'scrap') return 'scrap'
  if (outcome === 'ok') return 'recovered'
  if (current === 'diagnosis' && outcome === 'begin') return 'attempt_1'
  if (current === 'attempt_1' && outcome === 'nok') return 'attempt_2'
  if (current === 'attempt_2' && outcome === 'nok') return 'scrap'
  return current
}

/**
 * Returns true when the step has consumed all retry attempts and any further
 * NOK must auto-scrap. Used by the HMI to disable the retry button and by the
 * API to enforce auto-scrap on the 3rd attempt.
 */
export function isMaxAttemptsReached(attemptCount: number): boolean {
  return attemptCount >= MAX_RECOVERY_ATTEMPTS
}
