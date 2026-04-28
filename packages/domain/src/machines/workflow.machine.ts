import { createMachine, assign } from 'xstate'

/**
 * WorkflowVersion statuses mirror the Prisma schema exactly:
 *   draft → approved → deprecated
 *   draft → deprecated (direct deprecation without approval)
 * deprecated is a terminal state.
 */

export type WorkflowVersionStatus = 'draft' | 'approved' | 'deprecated'

export interface WorkflowVersionContext {
  versionId: string
  workflowId: string
  lastTransitionAt: string
  lastTransitionBy: string
  approvedBy: string | null
  approvedAt: string | null
}

export type WorkflowVersionEvent =
  | { type: 'EDIT'; by: string }
  | { type: 'APPROVE'; by: string }
  | { type: 'DEPRECATE'; by: string }

function now(): string {
  return new Date().toISOString()
}

export const workflowVersionMachine = createMachine({
  id: 'workflowVersion',
  types: {
    context: {} as WorkflowVersionContext,
    events: {} as WorkflowVersionEvent,
  },
  initial: 'draft',
  context: ({
    input,
  }: {
    input: { versionId: string; workflowId: string; by: string }
  }) => ({
    versionId: input.versionId,
    workflowId: input.workflowId,
    lastTransitionAt: now(),
    lastTransitionBy: input.by,
    approvedBy: null,
    approvedAt: null,
  }),
  states: {
    draft: {
      on: {
        EDIT: {
          target: 'draft',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
        APPROVE: {
          target: 'approved',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
            approvedBy: event.by,
            approvedAt: now(),
          })),
        },
        DEPRECATE: {
          target: 'deprecated',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    approved: {
      on: {
        DEPRECATE: {
          target: 'deprecated',
          actions: assign(({ event }) => ({
            lastTransitionAt: now(),
            lastTransitionBy: event.by,
          })),
        },
      },
    },

    deprecated: {
      type: 'final',
    },
  },
})
