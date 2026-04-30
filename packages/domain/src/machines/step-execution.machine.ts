import { createMachine, assign } from 'xstate'

/**
 * StepExecution statuses (D3 of PROMPT_5_FULL):
 *
 * pending → running → done                (happy path)
 *                   → paused → running    (operator pause / resume)
 *                   → blocked              (NOK; awaits recovery)
 *                   → qc_hold              (when category=quality_control)
 *
 * blocked → scrapped → recovered          (scrap then recover)
 * blocked → recovered                     (recover without scrap)
 * recovered → running | done              (continue or close out)
 *
 * any non-final → cancelled               (WO cancel cascade)
 * any non-final → skipped                 (operator skip)
 * any non-final → error                   (catch-all)
 * error → pending                         (admin RESET)
 *
 * Final states: done, skipped, cancelled. (`scrapped` and `recovered` are
 * intentionally non-final to allow further transitions for recovery flows.)
 */

export type StepExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'blocked'
  | 'qc_hold'
  | 'scrapped'
  | 'done'
  | 'skipped'
  | 'cancelled'
  | 'recovered'
  | 'error'

export interface StepExecutionContext {
  stepExecutionId: string
  workOrderId: string
  stepId: string
  stepCategory: string // packages/types StepCategory value, kept loose to avoid cross-package import
  operatorId: string | null
  startedAt: string | null
  elapsedSec: number
  causeCode: string | null
  notes: string[]
  lastTransitionAt: string
  lastTransitionBy: string
  errorCode: string | null
  errorMessage: string | null
}

export type StepExecutionEvent =
  | { type: 'START'; by: string }
  | { type: 'COMPLETE_OK'; by: string; durationSec?: number }
  | { type: 'COMPLETE_NOK'; by: string; causeCode: string; notes?: string }
  | { type: 'PAUSE'; by: string; reason?: string }
  | { type: 'RESUME'; by: string }
  | { type: 'REQUEST_QC'; by: string }
  | { type: 'QC_APPROVE'; by: string; approverId: string }
  | { type: 'QC_REJECT'; by: string; approverId: string; reason: string }
  | { type: 'SKIP'; by: string; reason: string }
  | { type: 'CANCEL'; by: string; reason: string }
  | { type: 'MARK_SCRAPPED'; by: string; reason: string }
  | { type: 'RECOVER'; by: string; notes?: string }
  | { type: 'RESUME_AFTER_RECOVERY'; by: string }
  | { type: 'COMPLETE_AFTER_RECOVERY'; by: string }
  | { type: 'ERROR'; by: string; errorCode: string; message: string }
  | { type: 'RESET'; by: string; supervisorId: string }
  | { type: 'RECORD_NOTE'; by: string; note: string }
  | { type: 'ASSIGN_OPERATOR'; by: string; operatorId: string }
  | { type: 'TICK'; secondsDelta?: number }

const QC_CATEGORY = 'quality_control'

function now() {
  return new Date().toISOString()
}

export interface StepExecutionInput {
  stepExecutionId: string
  workOrderId: string
  stepId: string
  stepCategory: string
  operatorId?: string | null
  by: string
}

export const stepExecutionMachine = createMachine({
  id: 'stepExecution',
  types: {
    context: {} as StepExecutionContext,
    events: {} as StepExecutionEvent,
  },
  initial: 'pending',
  context: ({ input }: { input: StepExecutionInput }) => ({
    stepExecutionId: input.stepExecutionId,
    workOrderId: input.workOrderId,
    stepId: input.stepId,
    stepCategory: input.stepCategory,
    operatorId: input.operatorId ?? null,
    startedAt: null,
    elapsedSec: 0,
    causeCode: null,
    notes: [],
    lastTransitionAt: now(),
    lastTransitionBy: input.by,
    errorCode: null,
    errorMessage: null,
  }),
  states: {
    pending: {
      on: {
        START: {
          target: 'running',
          actions: assign(({ event }) => ({
            startedAt: now(),
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ASSIGN_OPERATOR: {
          actions: assign(({ event }) => ({
            operatorId: event.operatorId,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        SKIP: {
          target: 'skipped',
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, `skipped: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ERROR: {
          target: 'error',
          actions: assign(({ event }) => ({
            errorCode: event.errorCode,
            errorMessage: event.message,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    running: {
      on: {
        COMPLETE_OK: {
          target: 'done',
          actions: assign(({ context, event }) => ({
            elapsedSec:
              event.durationSec !== undefined
                ? event.durationSec
                : context.elapsedSec,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        COMPLETE_NOK: {
          target: 'blocked',
          actions: assign(({ context, event }) => ({
            causeCode: event.causeCode,
            notes: event.notes
              ? [...context.notes, `nok: ${event.notes}`]
              : context.notes,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        PAUSE: {
          target: 'paused',
          actions: assign(({ context, event }) => ({
            notes: event.reason
              ? [...context.notes, `paused: ${event.reason}`]
              : context.notes,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        REQUEST_QC: {
          target: 'qc_hold',
          guard: ({ context }) => context.stepCategory === QC_CATEGORY,
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        TICK: {
          actions: assign(({ context, event }) => ({
            elapsedSec: context.elapsedSec + (event.secondsDelta ?? 1),
          })),
        },
        RECORD_NOTE: {
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, event.note],
            lastTransitionBy: event.by,
          })),
        },
        SKIP: {
          target: 'skipped',
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, `skipped: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ERROR: {
          target: 'error',
          actions: assign(({ event }) => ({
            errorCode: event.errorCode,
            errorMessage: event.message,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    paused: {
      on: {
        RESUME: {
          target: 'running',
          actions: assign(({ event }) => ({
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
        SKIP: {
          target: 'skipped',
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, `skipped: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ERROR: {
          target: 'error',
          actions: assign(({ event }) => ({
            errorCode: event.errorCode,
            errorMessage: event.message,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    blocked: {
      on: {
        MARK_SCRAPPED: {
          target: 'scrapped',
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, `scrapped: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        RECOVER: {
          target: 'recovered',
          actions: assign(({ context, event }) => ({
            notes: event.notes
              ? [...context.notes, `recover: ${event.notes}`]
              : context.notes,
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
        SKIP: {
          target: 'skipped',
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, `skipped: ${event.reason}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ERROR: {
          target: 'error',
          actions: assign(({ event }) => ({
            errorCode: event.errorCode,
            errorMessage: event.message,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    qc_hold: {
      on: {
        QC_APPROVE: {
          target: 'done',
          actions: assign(({ context, event }) => ({
            notes: [...context.notes, `qc_approve: ${event.approverId}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        QC_REJECT: {
          target: 'blocked',
          actions: assign(({ context, event }) => ({
            causeCode: 'qc_reject',
            notes: [
              ...context.notes,
              `qc_reject by ${event.approverId}: ${event.reason}`,
            ],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ERROR: {
          target: 'error',
          actions: assign(({ event }) => ({
            errorCode: event.errorCode,
            errorMessage: event.message,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    scrapped: {
      on: {
        RECOVER: {
          target: 'recovered',
          actions: assign(({ context, event }) => ({
            notes: event.notes
              ? [...context.notes, `recover_after_scrap: ${event.notes}`]
              : context.notes,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    recovered: {
      on: {
        RESUME_AFTER_RECOVERY: {
          target: 'running',
          actions: assign(({ event }) => ({
            startedAt: now(),
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        COMPLETE_AFTER_RECOVERY: {
          target: 'done',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        ERROR: {
          target: 'error',
          actions: assign(({ event }) => ({
            errorCode: event.errorCode,
            errorMessage: event.message,
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    error: {
      on: {
        RESET: {
          target: 'pending',
          actions: assign(({ context, event }) => ({
            errorCode: null,
            errorMessage: null,
            notes: [...context.notes, `reset by ${event.supervisorId}`],
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        CANCEL: {
          target: 'cancelled',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    done: {
      type: 'final',
    },

    skipped: {
      type: 'final',
    },

    cancelled: {
      type: 'final',
    },
  },
})
