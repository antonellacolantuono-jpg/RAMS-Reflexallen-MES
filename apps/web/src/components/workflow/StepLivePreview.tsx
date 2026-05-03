'use client'

// PROMPT_3c — Live Preview operator's-eye sidebar.
//
// Subscribes to the workflow editor's Zustand store, resolves the currently
// selected step node, and renders <LivePreviewStepCard> at the engineer's
// chosen state. Lets the engineer click through the 11 spec states without
// releasing a WO + logging into the HMI.

import { useEffect, useMemo, useState } from 'react'
import { useWorkflowStore } from './store'
import { LivePreviewStepCard } from './LivePreviewStepCard'
import { mockStateFields, nodeToPreviewData } from './livePreview/mockData'
import {
  PREVIEW_STATES_KO,
  PREVIEW_STATES_OK,
  type PreviewState,
} from './livePreview/states'

interface StateChipProps {
  active: boolean
  label: string
  group: 'ok' | 'ko'
  onClick: () => void
}

function StateChip({ active, label, group, onClick }: StateChipProps) {
  const activeCls =
    group === 'ok'
      ? 'bg-ok-soft text-ok-ink ring-2 ring-ok'
      : 'bg-bad-soft text-bad-ink ring-2 ring-bad'
  const inactiveCls = 'bg-paper-2 text-ink-2 hover:bg-paper-3'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-pill px-3 py-1 text-xs font-medium transition-colors',
        active ? activeCls : inactiveCls,
      ].join(' ')}
      data-state-chip={label}
      data-active={active}
    >
      {label}
    </button>
  )
}

export function StepLivePreview() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkflowStore((s) => s.selectedNodeType)
  const nodes = useWorkflowStore((s) => s.nodes)
  const [previewState, setPreviewState] = useState<PreviewState>('idle')

  // Reset to `idle` whenever the engineer selects a different step so the
  // preview always opens in a neutral baseline.
  useEffect(() => {
    setPreviewState('idle')
  }, [selectedNodeId])

  const node = useMemo(
    () =>
      selectedNodeId
        ? nodes.find((n) => n.id === selectedNodeId)
        : undefined,
    [nodes, selectedNodeId],
  )

  const preview = useMemo(() => nodeToPreviewData(node), [node])

  if (selectedNodeType !== 'stepNode' || !preview) {
    return (
      <div className="h-full flex flex-col bg-[var(--paper-2)] overflow-hidden">
        <div className="px-3 py-2 hairline-b shrink-0 flex items-center justify-between">
          <span className="uppercase-label">Anteprima Operatore</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-sm text-ink-3 text-center">
          Seleziona uno step nel canvas per vedere come apparirà
          all&apos;operatore sull&apos;HMI.
        </div>
      </div>
    )
  }

  const runtime = mockStateFields(previewState, preview.id)

  return (
    <div className="h-full flex flex-col bg-[var(--paper-2)] overflow-hidden">
      <div className="px-3 py-2 hairline-b shrink-0 flex items-center justify-between">
        <span className="uppercase-label">Anteprima Operatore</span>
        <button
          type="button"
          onClick={() => setPreviewState('idle')}
          className="text-xs text-ink-3 hover:text-ink-2 underline"
          data-testid="live-preview-reset"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-ink-3 font-semibold">
            Flusso OK
          </div>
          <div className="flex flex-wrap gap-1.5" data-chip-group="ok">
            {PREVIEW_STATES_OK.map((meta) => (
              <StateChip
                key={meta.id}
                active={previewState === meta.id}
                label={meta.label}
                group="ok"
                onClick={() => setPreviewState(meta.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-ink-3 font-semibold">
            Flusso KO
          </div>
          <div className="flex flex-wrap gap-1.5" data-chip-group="ko">
            {PREVIEW_STATES_KO.map((meta) => (
              <StateChip
                key={meta.id}
                active={previewState === meta.id}
                label={meta.label}
                group="ko"
                onClick={() => setPreviewState(meta.id)}
              />
            ))}
          </div>
        </div>

        <div className="hairline-t pt-3">
          <LivePreviewStepCard
            step={preview}
            state={previewState}
            runtime={runtime}
          />
        </div>
      </div>
    </div>
  )
}
