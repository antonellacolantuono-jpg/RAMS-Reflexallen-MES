'use client'
import * as React from 'react'
import type { PressureSample } from '../../lib/use-device-cycle'

export interface PressureChartProps {
  history: PressureSample[]
  targetBar: number
  toleranceBar: number
  width?: number
  height?: number
  className?: string
}

export function PressureChart({
  history,
  targetBar,
  toleranceBar,
  width = 360,
  height = 80,
  className,
}: PressureChartProps) {
  const minBar = targetBar - toleranceBar * 3
  const maxBar = targetBar + toleranceBar * 3
  const yBand = maxBar - minBar
  const points = history.length

  const path = history
    .map((sample, idx) => {
      const x = points <= 1 ? 0 : (idx / (points - 1)) * width
      const yClamped = Math.max(minBar, Math.min(maxBar, sample.bar))
      const y = height - ((yClamped - minBar) / yBand) * height
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const targetY = height - ((targetBar - minBar) / yBand) * height
  const upperY = height - ((targetBar + toleranceBar - minBar) / yBand) * height
  const lowerY = height - ((targetBar - toleranceBar - minBar) / yBand) * height

  return (
    <svg
      role="img"
      aria-label={`Pressure chart, ${points} samples`}
      width={width}
      height={height}
      className={className}
      data-testid="pressure-chart"
    >
      <rect width={width} height={height} fill="transparent" />
      <line
        x1={0}
        x2={width}
        y1={upperY}
        y2={upperY}
        stroke="currentColor"
        strokeOpacity={0.18}
        strokeDasharray="3 3"
      />
      <line
        x1={0}
        x2={width}
        y1={lowerY}
        y2={lowerY}
        stroke="currentColor"
        strokeOpacity={0.18}
        strokeDasharray="3 3"
      />
      <line
        x1={0}
        x2={width}
        y1={targetY}
        y2={targetY}
        stroke="currentColor"
        strokeOpacity={0.35}
      />
      {points > 1 && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          data-testid="pressure-line"
        />
      )}
      {history.map((sample, idx) => {
        const x = points <= 1 ? 0 : (idx / (points - 1)) * width
        const yClamped = Math.max(minBar, Math.min(maxBar, sample.bar))
        const y = height - ((yClamped - minBar) / yBand) * height
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={1.5}
            fill="currentColor"
            data-testid="pressure-point"
          />
        )
      })}
    </svg>
  )
}
