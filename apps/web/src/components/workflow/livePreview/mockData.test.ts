import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import { mockStateFields, nodeToPreviewData } from './mockData'
import { PREVIEW_STATES } from './states'

function makeStepNode(data: Record<string, unknown> = {}): Node {
  return {
    id: 'step-1',
    type: 'stepNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Verifica visiva pezzo',
      category: 'quality_control',
      actionType: 'visual_check',
      instructions: 'Controllare la finitura della superficie A.',
      ...data,
    },
  }
}

describe('nodeToPreviewData', () => {
  it('returns null for non-step nodes', () => {
    const phase: Node = {
      id: 'phase-1',
      type: 'phaseNode',
      position: { x: 0, y: 0 },
      data: { label: 'Setup' },
    }
    expect(nodeToPreviewData(phase)).toBeNull()
    expect(nodeToPreviewData(undefined)).toBeNull()
  })

  it('extracts step config from node.data and falls back to safe defaults', () => {
    const node = makeStepNode()
    const preview = nodeToPreviewData(node)
    expect(preview).not.toBeNull()
    expect(preview!.id).toBe('step-1')
    expect(preview!.name).toBe('Verifica visiva pezzo')
    expect(preview!.category).toBe('quality_control')
    expect(preview!.actionType).toBe('visual_check')
    expect(preview!.instructions).toBe(
      'Controllare la finitura della superficie A.',
    )
  })

  it('uses fallback instructions when none are configured', () => {
    const node = makeStepNode({ instructions: '' })
    const preview = nodeToPreviewData(node)
    expect(preview!.instructions).toBe(
      'Esegui la verifica visiva del componente secondo SOP.',
    )
  })

  it('passes through optional photo + device fields', () => {
    const node = makeStepNode({
      photoUrl: 'data:image/png;base64,AAAA',
      deviceCategory: 'leak_tester',
      deviceSerialNumber: 'DEV-LEAK-001',
    })
    const preview = nodeToPreviewData(node)
    expect(preview!.photoUrl).toBe('data:image/png;base64,AAAA')
    expect(preview!.deviceCategory).toBe('leak_tester')
    expect(preview!.deviceSerialNumber).toBe('DEV-LEAK-001')
  })
})

describe('mockStateFields — determinism', () => {
  it('returns identical runtime fields for the same (state, stepId) pair', () => {
    for (const meta of PREVIEW_STATES) {
      const a = mockStateFields(meta.id, 'step-abc-123')
      const b = mockStateFields(meta.id, 'step-abc-123')
      expect(a).toEqual(b)
    }
  })

  it('varies durationSec across distinct stepIds for in_progress', () => {
    const a = mockStateFields('in_progress', 'step-aaa')
    const b = mockStateFields('in_progress', 'step-bbb')
    expect(a.durationSec).not.toBe(b.durationSec)
    expect(a.durationSec).toBeGreaterThanOrEqual(30)
    expect(a.durationSec).toBeLessThan(180)
  })

  it('keeps idle/ready/offline durations null + zero attempts', () => {
    expect(mockStateFields('idle', 'x').durationSec).toBeNull()
    expect(mockStateFields('idle', 'x').attemptCount).toBe(0)
    expect(mockStateFields('ready', 'x').durationSec).toBeNull()
    expect(mockStateFields('offline', 'x').durationSec).toBeNull()
    expect(mockStateFields('offline', 'x').attemptCount).toBe(0)
  })

  it('attaches a blockedNote for failure-flow states', () => {
    expect(mockStateFields('error', 'step-x').blockedNote).not.toBeNull()
    expect(mockStateFields('failed', 'step-x').blockedNote).not.toBeNull()
    expect(mockStateFields('warning', 'step-x').blockedNote).not.toBeNull()
    expect(mockStateFields('timeout', 'step-x').blockedNote).not.toBeNull()
    expect(mockStateFields('offline', 'step-x').blockedNote).not.toBeNull()
  })

  it('uses attemptCount=2 for retry/failed (re-attempt semantics)', () => {
    expect(mockStateFields('retry', 'x').attemptCount).toBe(2)
    expect(mockStateFields('failed', 'x').attemptCount).toBe(2)
  })
})
