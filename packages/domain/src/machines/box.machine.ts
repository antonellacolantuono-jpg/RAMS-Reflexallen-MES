import { createMachine, assign } from 'xstate'

/**
 * Box lifecycle: empty → filling → full → sealed → shipped | returned
 * A box can be rejected at any stage (quality hold).
 */

export type BoxStatus =
  | 'empty'
  | 'filling'
  | 'full'
  | 'sealed'
  | 'shipped'
  | 'returned'
  | 'rejected'

export interface BoxContext {
  boxId: string
  boxTypeId: string
  maxUnits: number
  currentUnits: number
  workOrderId: string | null
  lotId: string | null
  sealedAt: string | null
  lastTransitionAt: string
  lastTransitionBy: string
}

export type BoxEvent =
  | { type: 'START_FILLING'; workOrderId: string; lotId: string; by: string }
  | { type: 'ADD_UNITS'; qty: number; by: string }
  | { type: 'MARK_FULL'; by: string }
  | { type: 'SEAL'; by: string }
  | { type: 'SHIP'; by: string }
  | { type: 'RETURN'; by: string }
  | { type: 'REJECT'; by: string }
  | { type: 'REOPEN'; by: string }

function now() {
  return new Date().toISOString()
}

export const boxMachine = createMachine(
  {
    id: 'box',
    types: {
      context: {} as BoxContext,
      events: {} as BoxEvent,
    },
    initial: 'empty',
    context: ({
      input,
    }: {
      input: { boxId: string; boxTypeId: string; maxUnits: number; by: string }
    }) => ({
      boxId: input.boxId,
      boxTypeId: input.boxTypeId,
      maxUnits: input.maxUnits,
      currentUnits: 0,
      workOrderId: null,
      lotId: null,
      sealedAt: null,
      lastTransitionAt: now(),
      lastTransitionBy: input.by,
    }),
    states: {
      empty: {
        on: {
          START_FILLING: {
            target: 'filling',
            actions: assign(({ event }) => ({
              workOrderId: event.workOrderId,
              lotId: event.lotId,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REJECT: {
            target: 'rejected',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      filling: {
        on: {
          ADD_UNITS: {
            actions: assign(({ context, event }) => ({
              currentUnits: Math.min(context.currentUnits + event.qty, context.maxUnits),
              lastTransitionBy: event.by,
            })),
          },
          MARK_FULL: {
            target: 'full',
            guard: ({ context }) => context.currentUnits > 0,
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REJECT: {
            target: 'rejected',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      full: {
        on: {
          SEAL: {
            target: 'sealed',
            actions: assign(({ event }) => ({
              sealedAt: now(),
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REOPEN: {
            target: 'filling',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REJECT: {
            target: 'rejected',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      sealed: {
        on: {
          SHIP: {
            target: 'shipped',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REJECT: {
            target: 'rejected',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      shipped: {
        on: {
          RETURN: {
            target: 'returned',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      returned: {
        on: {
          REJECT: {
            target: 'rejected',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      rejected: {
        type: 'final',
      },
    },
  },
)
