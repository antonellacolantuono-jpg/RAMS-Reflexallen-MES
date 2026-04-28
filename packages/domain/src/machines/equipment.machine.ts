import { createMachine, assign } from 'xstate'

/**
 * Equipment states (ISA-95 / ADR-018):
 * offline → available → reserved → in_use → cleaning | maintenance | broken
 * cleaning → available
 * maintenance → available | broken
 * broken → maintenance | decommissioned
 * any → decommissioned (admin action)
 */

export type EquipmentState =
  | 'offline'
  | 'available'
  | 'reserved'
  | 'in_use'
  | 'cleaning'
  | 'maintenance'
  | 'broken'
  | 'decommissioned'

export interface EquipmentContext {
  equipmentId: string
  reservedByWorkOrderId: string | null
  currentWorkOrderId: string | null
  maintenanceOrderId: string | null
  lastTransitionAt: string
  lastTransitionBy: string
}

export type EquipmentEvent =
  | { type: 'ACTIVATE'; by: string }
  | { type: 'RESERVE'; workOrderId: string; by: string }
  | { type: 'RELEASE_RESERVATION'; by: string }
  | { type: 'START_USE'; workOrderId: string; by: string }
  | { type: 'FINISH_USE'; by: string }
  | { type: 'START_CLEANING'; by: string }
  | { type: 'FINISH_CLEANING'; by: string }
  | { type: 'START_MAINTENANCE'; maintenanceOrderId: string; by: string }
  | { type: 'FINISH_MAINTENANCE'; by: string }
  | { type: 'REPORT_BREAKDOWN'; by: string }
  | { type: 'DECOMMISSION'; by: string }
  | { type: 'TAKE_OFFLINE'; by: string }

function now() {
  return new Date().toISOString()
}

export const equipmentMachine = createMachine(
  {
    id: 'equipment',
    types: {
      context: {} as EquipmentContext,
      events: {} as EquipmentEvent,
    },
    initial: 'offline',
    context: ({ input }: { input: { equipmentId: string; by: string } }) => ({
      equipmentId: input.equipmentId,
      reservedByWorkOrderId: null,
      currentWorkOrderId: null,
      maintenanceOrderId: null,
      lastTransitionAt: now(),
      lastTransitionBy: input.by,
    }),
    states: {
      offline: {
        on: {
          ACTIVATE: {
            target: 'available',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      available: {
        on: {
          RESERVE: {
            target: 'reserved',
            actions: assign(({ event }) => ({
              reservedByWorkOrderId: event.workOrderId,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          START_MAINTENANCE: {
            target: 'maintenance',
            actions: assign(({ event }) => ({
              maintenanceOrderId: event.maintenanceOrderId,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          START_CLEANING: {
            target: 'cleaning',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          TAKE_OFFLINE: {
            target: 'offline',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          DECOMMISSION: {
            target: 'decommissioned',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      reserved: {
        on: {
          START_USE: {
            target: 'in_use',
            guard: ({ context, event }) =>
              context.reservedByWorkOrderId === event.workOrderId,
            actions: assign(({ event }) => ({
              currentWorkOrderId: event.workOrderId,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          RELEASE_RESERVATION: {
            target: 'available',
            actions: assign(({ event }) => ({
              reservedByWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REPORT_BREAKDOWN: {
            target: 'broken',
            actions: assign(({ event }) => ({
              reservedByWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          DECOMMISSION: {
            target: 'decommissioned',
            actions: assign(({ event }) => ({
              reservedByWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      in_use: {
        on: {
          FINISH_USE: {
            target: 'available',
            actions: assign(({ event }) => ({
              currentWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          START_CLEANING: {
            target: 'cleaning',
            actions: assign(({ event }) => ({
              currentWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REPORT_BREAKDOWN: {
            target: 'broken',
            actions: assign(({ event }) => ({
              currentWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          DECOMMISSION: {
            target: 'decommissioned',
            actions: assign(({ event }) => ({
              currentWorkOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      cleaning: {
        on: {
          FINISH_CLEANING: {
            target: 'available',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REPORT_BREAKDOWN: {
            target: 'broken',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          DECOMMISSION: {
            target: 'decommissioned',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      maintenance: {
        on: {
          FINISH_MAINTENANCE: {
            target: 'available',
            actions: assign(({ event }) => ({
              maintenanceOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          REPORT_BREAKDOWN: {
            target: 'broken',
            actions: assign(({ event }) => ({
              maintenanceOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          DECOMMISSION: {
            target: 'decommissioned',
            actions: assign(({ event }) => ({
              maintenanceOrderId: null,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      broken: {
        on: {
          START_MAINTENANCE: {
            target: 'maintenance',
            actions: assign(({ event }) => ({
              maintenanceOrderId: event.maintenanceOrderId,
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
          DECOMMISSION: {
            target: 'decommissioned',
            actions: assign(({ event }) => ({
              lastTransitionAt: now(),
              lastTransitionBy: event.by,
            })),
          },
        },
      },

      decommissioned: {
        type: 'final',
      },
    },
  },
)
