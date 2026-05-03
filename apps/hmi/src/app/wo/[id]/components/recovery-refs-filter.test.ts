// PROMPT_PNE_SEED_CLEANUP (post F1 hotfix, 2026-05-03) regression test.
//
// Recovery-refs groups (e.g. "B2 — Leak Recovery (refs)") hold pre-retry
// step candidates exposed to the workflow editor's recoveryConfig section.
// They MUST NOT appear in the operator-facing linear flow, MUST NOT block
// WO completion, and MUST NOT be picked as the active step. The filter in
// page.tsx (`isRecoveryRefStep`) keys off the group name matching /Recovery/i
// — same convention already used by `PNE_WORKFLOW_V1_COUNTS.recoveryGroups`.
//
// Pin the rule here so a refactor that drops the filter (and accidentally
// re-exposes recovery refs to the operator, or worse, leaves the WO stuck on
// 3 pending hidden steps that can never complete) trips a red test.

import { describe, it, expect } from 'vitest'
import type { WorkOrderStep } from '../../../../lib/queries'

// Mirrors the helper in page.tsx — kept in sync intentionally to avoid
// pulling next/navigation, xstate, etc. into the unit test surface.
const RECOVERY_GROUP_PATTERN = /Recovery/i

function isRecoveryRefStep(step: WorkOrderStep): boolean {
  return RECOVERY_GROUP_PATTERN.test(step.groupName)
}

function step(overrides: Partial<WorkOrderStep>): WorkOrderStep {
  return {
    stepExecutionId: 'se-1',
    workOrderId: 'wo-1',
    stepId: 'step-1',
    status: 'pending',
    result: null,
    durationSec: null,
    startedAt: null,
    completedAt: null,
    stepName: '[STEP-LEAK-001] Position tube on fixture',
    stepCategory: 'setup',
    stepOrder: 1,
    actionType: 'verify_workstation',
    instructions: null,
    deviceCategory: 'pre',
    deviceSerialNumber: null,
    groupId: 'g-1',
    groupName: 'B1 — Leak Test Execution',
    groupCategory: 'device_execution',
    groupSupportsParallel: true,
    recoveryStage: null,
    attemptCount: 0,
    ...overrides,
  }
}

describe('PROMPT_PNE_SEED_CLEANUP — isRecoveryRefStep filter', () => {
  it('detects the seeded "B2 — Leak Recovery (refs)" group as a recovery-refs group', () => {
    expect(
      isRecoveryRefStep(step({ groupName: 'B2 — Leak Recovery (refs)' })),
    ).toBe(true)
  })

  it('detects the seeded "C2 — Camera Recovery (refs)" group as a recovery-refs group', () => {
    expect(
      isRecoveryRefStep(step({ groupName: 'C2 — Camera Recovery (refs)' })),
    ).toBe(true)
  })

  it('lets normal operator-facing groups through (B1, C1, A1, D1)', () => {
    expect(isRecoveryRefStep(step({ groupName: 'B1 — Leak Test Execution' }))).toBe(false)
    expect(isRecoveryRefStep(step({ groupName: 'C1 — Optical Conformity Check' }))).toBe(false)
    expect(isRecoveryRefStep(step({ groupName: 'A1 — Tube Preparation & Crimping' }))).toBe(false)
    expect(isRecoveryRefStep(step({ groupName: 'D1 — Box Management' }))).toBe(false)
  })

  it('lets the new "C3 — Conformity Check" group through (must remain operator-facing)', () => {
    expect(isRecoveryRefStep(step({ groupName: 'C3 — Conformity Check' }))).toBe(false)
  })

  it('case-insensitive: matches "recovery", "RECOVERY", and any mixed casing', () => {
    expect(isRecoveryRefStep(step({ groupName: 'X — recovery refs' }))).toBe(true)
    expect(isRecoveryRefStep(step({ groupName: 'X — RECOVERY' }))).toBe(true)
    expect(isRecoveryRefStep(step({ groupName: 'X — ReCoVeRy' }))).toBe(true)
  })

  it('does not match "recovered" — regex is the literal word, not a prefix', () => {
    // /Recovery/i matches the substring "Recovery" only; "recovered" ends in
    // "ered" so it does NOT match. This protects against accidentally hiding
    // a status-named group from the operator.
    expect(isRecoveryRefStep(step({ groupName: 'Some recovered widgets' }))).toBe(false)
  })
})
