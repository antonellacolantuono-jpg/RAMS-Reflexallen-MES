'use client'

import * as React from 'react'

const TONE_FILL: Record<string, string> = {
  ink: 'var(--ink-3)',
  accent: 'var(--accent)',
  bad: 'var(--bad)',
}

/**
 * Shared SVG <defs> with arrow markers used by `<Edge>`.
 * Render once per canvas (e.g. as the first child of the parent <svg>).
 */
export function ArrowDefs() {
  return (
    <defs>
      {(['ink', 'accent', 'bad'] as const).map((t) => (
        <marker
          key={t}
          id={`canvas-arrow-${t}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 z" fill={TONE_FILL[t]} />
        </marker>
      ))}
    </defs>
  )
}
