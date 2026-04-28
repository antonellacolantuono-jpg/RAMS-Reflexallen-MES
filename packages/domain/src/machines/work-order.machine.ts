import { createMachine, assign } from 'xstate'

/**
 * WorkOrder statuses:
 * draft → planned → released → in_progress → (on_hold | partially_completed) → completed | cancelled
 * closed is the terminal archive state after completed
 */

export type WorkOrderStatus =
  | 'draft'
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'on_hold'
  | 'partially_completed'
  | 'completed'
  | 'closed'
  | 'cancelled'

export interface WorkOrderContext {
  workOrderId: string
  qtyTarget: number
  qtyProduced: number
  qtyGood: number
  qtyScrap: number
  lastTransitionAt: string
  lastTransitionBy: string
  holdReason: string | null
}

export type WorkOrderEvent =
  | { type: 'PLAN'; by: string }
  | { type: 'RELEASE'; by: string }
  | { type: 'START'; by: string }
  | { type: 'RECORD_OUTPUT'; qty: number; good: number; scrap: number; by: string }
  | { type: 'HOLD'; reason: string; by: string }
  | { type: 'RESUME'; by: string }
  | { type: 'COMPLETE'; by: string }
  | { type: 'CLOSE'; by: string }
  | { type: 'CANCEL'; by: string }

function now() {
  return new Date().toISOString()
}

export const workOrderMachine = createMachine(
  {
    id: 'workOrder',
    types: {
      context: {} as WorkOrderContext,
      events: {} as WorkOrderEvent,
    },
    initial: 'draft',
    context: ({
      input,
    }: {
      input: { workOrderId: string; qtyTarget: number; by: string }
    }) => ({
      workOrderId: input.workOrderId,
      qtyTarget: input.qtyTarget,
      qtyProduced: 0,
      qtyGood: 0,
      qtyScrap: 0,
      lastTransitionAt: now(),
      lastTransitionBy: input.by,
      holdReason: null,
    }),
    states: {
      draft: {
        on: {
          PLAN: {
            target: 'planned',
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
        },
      },

      planned: {
        on: {
          RELEASE: {
            target: 'released',
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
        },
      },

      released: {
        on: {
          START: {
            target: 'in_progress',
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
        },
      },

      in_progress: {
        on: {
          RECORD_OUTPUT: {
            actions: assign(({ context, event }) => ({
              qtyProduced: context.qtyProduced + event.qty,
              qtyGood: context.qtyGood + event.good,
              qtyScrap: context.qtyScrap + event.scrap,
              lastTransitionBy: event.by,
            })),
          },
          HOLD: {
            target: 'on_hold',
            actions: assign(({ event }) => ({
              holdReason: event.reason,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          COMPLETE: [
            {
              target: 'completed',
              guard: ({ context }) => context.qtyProduced >= context.qtyTarget,
              actions: assign(({ event }) => ({
                lastTransitionAt: now(),
                lastTransitionBy: event.by,
              })),
            },
            {
              target: 'partially_completed',
              guard: ({ context }) =>
                context.qtyProduced > 0 && context.qtyProduced < context.qtyTarget,
              actions: assign(({ event }) => ({
                lastTransitionAt: now(),
                lastTransitionBy: event.by,
              })),
            },
          ],
          CANCEL: {
            target: 'cancelled',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      on_hold: {
        on: {
          RESUME: {
            target: 'in_progress',
            actions: assign(({ event }) => ({
              holdReason: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          CANCEL: {
            target: 'cancelled',
            actions: assign(({ event }) => ({
              holdReason: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      partially_completed: {
        on: {
          CLOSE: {
            target: 'closed',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      completed: {
        on: {
          CLOSE: {
            target: 'closed',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      closed: {
        type: 'final',
      },

      cancelled: {
        type: 'final',
      },
    },
  },
)
