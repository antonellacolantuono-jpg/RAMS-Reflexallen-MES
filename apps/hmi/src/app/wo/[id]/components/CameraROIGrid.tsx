'use client'
import * as React from 'react'

export interface RoiSample {
  /** Stable id (from simulator: 'raccordo_a' / 'raccordo_b' / 'label_position' / 'tape_position'). */
  roiId?: string
  name?: string
  similarityPct?: number
  similarity?: number
}

export interface CameraROIGridProps {
  rois: RoiSample[]
  /** Pass threshold per ROI (default 95% from RCP-CAMERA-PNE-001 v1). */
  passThresholdPct?: number
}

const ROI_LABELS_IT: Record<string, string> = {
  raccordo_a: 'Raccordo A',
  raccordo_b: 'Raccordo B',
  label_position: 'Posizione etichetta',
  tape_position: 'Posizione nastro',
}

function readSimilarity(roi: RoiSample): number {
  if (typeof roi.similarityPct === 'number') return roi.similarityPct
  if (typeof roi.similarity === 'number') return roi.similarity
  return 0
}

function readLabel(roi: RoiSample, fallback: string): string {
  const id = roi.roiId ?? roi.name ?? ''
  return ROI_LABELS_IT[id] ?? roi.name ?? fallback
}

export function CameraROIGrid({
  rois,
  passThresholdPct = 95,
}: CameraROIGridProps) {
  // Always render 4 cells so the grid layout is stable; pad with idle entries
  // when the simulator hasn't emitted progress yet.
  const padded = [...rois]
  while (padded.length < 4) padded.push({ roiId: `pending-${padded.length}` })

  return (
    <div
      className="grid grid-cols-2 gap-3"
      data-testid="camera-roi-grid"
      data-roi-count={padded.length}
    >
      {padded.slice(0, 4).map((roi, idx) => {
        const sim = readSimilarity(roi)
        const passed = sim >= passThresholdPct
        const label = readLabel(roi, `ROI ${idx + 1}`)
        return (
          <div
            key={roi.roiId ?? roi.name ?? idx}
            className={`rounded-2 border bg-paper p-3 flex flex-col gap-1 ${
              sim === 0
                ? 'border-line'
                : passed
                  ? 'border-ok'
                  : 'border-bad'
            }`}
            data-testid={`camera-roi-cell-${idx}`}
            data-roi-pass={sim === 0 ? 'pending' : passed ? 'true' : 'false'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">{label}</span>
              <span
                className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold ${
                  sim === 0
                    ? 'bg-paper-2 text-ink-3'
                    : passed
                      ? 'bg-ok-soft text-ok-ink'
                      : 'bg-bad-soft text-bad-ink'
                }`}
              >
                {sim === 0 ? 'In attesa' : passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <span
              className={`font-mono tabular-nums text-xl ${
                sim === 0 ? 'text-ink-3' : passed ? 'text-ok-ink' : 'text-bad-ink'
              }`}
            >
              {sim.toFixed(1)}%
            </span>
            <div className="h-1.5 w-full rounded-pill bg-paper-3 overflow-hidden">
              <div
                className={`h-full rounded-pill ${passed ? 'bg-ok' : 'bg-bad'}`}
                style={{ width: `${Math.min(100, Math.max(0, sim))}%` }}
              />
            </div>
            <span className="text-[10px] text-ink-3">
              soglia ≥ {passThresholdPct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
