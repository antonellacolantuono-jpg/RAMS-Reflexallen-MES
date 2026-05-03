// PNE_4_FOCUSED D3 — Parallel slot resolution.
//
// Given the flat list of WorkOrderStep DTOs returned by the WO steps endpoint
// + the active `device_main` step, returns the matching parallel siblings
// (same group, deviceCategory='parallel') sorted by step order.
//
// Per the PNE_2 seeded workflow: STEP-LEAK-003 (device_main) shares group B1
// with 3 parallel children — STEP-LEAK-004 (apply label), STEP-LEAK-005
// (apply tape), STEP-LEAK-006 (prepare next tube). The device cycle and the
// parallel slots all run concurrently while the operator works during the
// 45-second leak test.

import type { WorkOrderStep } from '../../../../lib/queries'

export function resolveParallelSiblings(
  steps: WorkOrderStep[],
  deviceMainStep: WorkOrderStep,
): WorkOrderStep[] {
  if (deviceMainStep.deviceCategory !== 'device_main') return []
  return steps
    .filter(
      (s) =>
        s.groupId === deviceMainStep.groupId &&
        s.deviceCategory === 'parallel',
    )
    .sort((a, b) => a.stepOrder - b.stepOrder)
}

/**
 * Counts how many of the given parallel slots are in a terminal state
 * (done / scrapped / skipped / cancelled). Used by the counter UI ("X/Y
 * paralleli completati").
 */
export function countCompletedParallels(slots: WorkOrderStep[]): number {
  return slots.filter(
    (s) =>
      s.status === 'done' ||
      s.status === 'scrapped' ||
      s.status === 'skipped' ||
      s.status === 'cancelled',
  ).length
}
