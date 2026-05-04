import { describe, it, expect } from 'vitest'
import type { Node } from '@xyflow/react'
import { buildSavePayload, parseStepData } from './save-payload'

// PROMPT_7 D1 — pure helper coverage. The save/load roundtrip is the
// load-bearing contract: workflow editor must NOT lose recoveryConfig +
// photoUrl on save → server → reopen. Tests pin both ends.

describe('parseStepData', () => {
  it('returns null for null/undefined/empty', () => {
    expect(parseStepData(null)).toBeNull()
    expect(parseStepData(undefined)).toBeNull()
    expect(parseStepData('')).toBeNull()
  })

  it('returns null for malformed JSON (never throws)', () => {
    expect(parseStepData('{bogus')).toBeNull()
    expect(parseStepData('not even close')).toBeNull()
  })

  it('returns null for non-object JSON (arrays, primitives)', () => {
    expect(parseStepData('[1,2,3]')).toBeNull()
    expect(parseStepData('42')).toBeNull()
    expect(parseStepData('"hello"')).toBeNull()
  })

  it('parses a recoveryConfig blob into a typed object', () => {
    const raw = JSON.stringify({
      recoveryConfig: {
        enabled: true,
        maxAttempts: 3,
        preRetryStepIds: ['step-a', 'step-b'],
      },
      photoUrl: '/uploads/foo.png',
      actionType: 'device_run',
    })
    const parsed = parseStepData(raw)
    expect(parsed).toEqual({
      recoveryConfig: {
        enabled: true,
        maxAttempts: 3,
        preRetryStepIds: ['step-a', 'step-b'],
      },
      photoUrl: '/uploads/foo.png',
      actionType: 'device_run',
    })
  })
})

// ── buildSavePayload roundtrip ───────────────────────────────────────────────

function makePhase(id: string, order: number): Node {
  return {
    id,
    type: 'phaseNode',
    position: { x: 0, y: 0 },
    data: { label: 'P1 — Production', category: 'production', order, isCycleBased: true },
  } as Node
}

function makeGroup(id: string, phaseId: string, order: number): Node {
  return {
    id,
    type: 'groupNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'G1 — Leak',
      category: 'device_execution',
      order,
      parentId: phaseId,
      supportsParallel: true,
      supportsRecovery: true,
    },
  } as Node
}

function makeStep(
  id: string,
  groupId: string,
  order: number,
  extra: Record<string, unknown> = {},
): Node {
  return {
    id,
    type: 'stepNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'STEP-LEAK-003',
      category: 'production',
      actionType: 'device_run',
      order,
      parentId: groupId,
      ...extra,
    },
  } as Node
}

describe('buildSavePayload — recoveryConfig persistence (PROMPT_7 D1)', () => {
  it('omits `data` slot when no recoveryConfig + no photoUrl is present', () => {
    const nodes = [
      makePhase('p1', 1),
      makeGroup('g1', 'p1', 1),
      makeStep('s1', 'g1', 1),
    ]
    const out = buildSavePayload(nodes)
    expect(out[0]!.groups[0]!.steps[0]).not.toHaveProperty('data')
  })

  it('emits `data.recoveryConfig` when set top-level on node.data', () => {
    const recoveryConfig = {
      enabled: true,
      maxAttempts: 2,
      preRetryStepIds: ['step-pre-1', 'step-pre-2'],
    }
    const nodes = [
      makePhase('p1', 1),
      makeGroup('g1', 'p1', 1),
      makeStep('s1', 'g1', 1, { recoveryConfig }),
    ]
    const out = buildSavePayload(nodes)
    const step = out[0]!.groups[0]!.steps[0]!
    expect(step.data).toBeDefined()
    expect(step.data!['recoveryConfig']).toEqual(recoveryConfig)
  })

  it('falls back to `node.data.actionConfig.automatic.recoveryConfig` (AddStepDialog write path)', () => {
    const recoveryConfig = {
      enabled: true,
      maxAttempts: 3,
      preRetryStepIds: ['ref-clean'],
    }
    const nodes = [
      makePhase('p1', 1),
      makeGroup('g1', 'p1', 1),
      makeStep('s1', 'g1', 1, {
        actionConfig: { automatic: { recoveryConfig, photoUrl: '/img/leak.png' } },
      }),
    ]
    const out = buildSavePayload(nodes)
    const step = out[0]!.groups[0]!.steps[0]!
    expect(step.data!['recoveryConfig']).toEqual(recoveryConfig)
    expect(step.data!['photoUrl']).toBe('/img/leak.png')
  })

  it('top-level recoveryConfig wins over actionConfig fallback when both present', () => {
    const top = { enabled: true, maxAttempts: 5, preRetryStepIds: [] }
    const nested = { enabled: false, maxAttempts: 1, preRetryStepIds: ['x'] }
    const nodes = [
      makePhase('p1', 1),
      makeGroup('g1', 'p1', 1),
      makeStep('s1', 'g1', 1, {
        recoveryConfig: top,
        actionConfig: { automatic: { recoveryConfig: nested } },
      }),
    ]
    const out = buildSavePayload(nodes)
    expect(out[0]!.groups[0]!.steps[0]!.data!['recoveryConfig']).toEqual(top)
  })

  it('always mirrors actionType into data when emitted (self-describing)', () => {
    const nodes = [
      makePhase('p1', 1),
      makeGroup('g1', 'p1', 1),
      makeStep('s1', 'g1', 1, { recoveryConfig: { enabled: true, maxAttempts: 2, preRetryStepIds: [] } }),
    ]
    const out = buildSavePayload(nodes)
    expect(out[0]!.groups[0]!.steps[0]!.data!['actionType']).toBe('device_run')
  })

  it('roundtrips through parseStepData → JSON.stringify → JSON.parse with no loss', () => {
    const recoveryConfig = {
      enabled: true,
      maxAttempts: 2,
      preRetryStepIds: ['step-clean', 'step-check'],
    }
    const nodes = [
      makePhase('p1', 1),
      makeGroup('g1', 'p1', 1),
      makeStep('s1', 'g1', 1, { recoveryConfig, photoUrl: '/uploads/x.png' }),
    ]
    const out = buildSavePayload(nodes)
    const dataPayload = out[0]!.groups[0]!.steps[0]!.data!
    // Server serialises with JSON.stringify, client re-parses on read.
    const reparsed = parseStepData(JSON.stringify(dataPayload))
    expect(reparsed).toEqual(dataPayload)
  })
})

// ── Fix-2 — Phase imageUrl serialization ──────────────────────────────────────
describe('buildSavePayload — Phase imageUrl (Fix-2)', () => {
  it('serializes phase imageUrl when present on node.data', () => {
    const phase: Node = {
      id: 'phase-img',
      type: 'phaseNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'Estrusione',
        category: 'production',
        order: 1,
        isCycleBased: true,
        imageUrl: 'data:image/png;base64,XYZ',
      },
    } as Node
    const out = buildSavePayload([phase])
    expect(out[0]?.imageUrl).toBe('data:image/png;base64,XYZ')
  })

  it('emits imageUrl=null when node.data has no imageUrl', () => {
    const out = buildSavePayload([makePhase('p1', 1)])
    expect(out[0]?.imageUrl).toBeNull()
  })

  it('emits imageUrl=null when node.data.imageUrl is empty string', () => {
    const phase: Node = {
      id: 'phase-empty',
      type: 'phaseNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'P',
        category: 'production',
        order: 1,
        isCycleBased: false,
        imageUrl: '',
      },
    } as Node
    const out = buildSavePayload([phase])
    expect(out[0]?.imageUrl).toBeNull()
  })
})
