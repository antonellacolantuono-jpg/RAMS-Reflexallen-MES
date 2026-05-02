'use client'

import * as React from 'react'

export type EdgeKind = 'bezier' | 'orthogonal' | 'straight'
export type EdgeTone = 'ink' | 'accent' | 'bad'

const TONE_STROKE: Record<EdgeTone, string> = {
  ink: 'var(--ink-3)',
  accent: 'var(--accent)',
  bad: 'var(--bad)',
}

export interface EdgeEndpoint {
  x: number
  y: number
}

export interface EdgeProps {
  from: EdgeEndpoint
  to: EdgeEndpoint
  kind?: EdgeKind
  tone?: EdgeTone
  label?: string
  animated?: boolean
}

export function Edge({ from, to, kind = 'bezier', tone = 'ink', label, animated }: EdgeProps) {
  const stroke = TONE_STROKE[tone]
  let d = ''
  if (kind === 'bezier') {
    const dx = Math.abs(to.x - from.x) * 0.5
    d = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
  } else if (kind === 'orthogonal') {
    const midX = (from.x + to.x) / 2
    d = `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`
  } else {
    d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }
  const labelX = (from.x + to.x) / 2
  const labelY = (from.y + to.y) / 2 - 6

  return (
    <g data-tone={tone} data-kind={kind}>
      <path
        d={d}
        stroke={stroke}
        strokeWidth={1.5}
        fill="none"
        markerEnd={`url(#canvas-arrow-${tone})`}
        strokeDasharray={animated ? '4 3' : undefined}
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-7"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </path>
      {label && (
        <g>
          <rect
            x={labelX - 28}
            y={labelY - 8}
            width={56}
            height={16}
            rx={3}
            fill="var(--paper)"
            stroke={stroke}
            strokeWidth={0.8}
          />
          <text
            x={labelX}
            y={labelY + 3}
            textAnchor="middle"
            fontSize={10}
            fill="var(--ink-2)"
            fontFamily="JetBrains Mono"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}
