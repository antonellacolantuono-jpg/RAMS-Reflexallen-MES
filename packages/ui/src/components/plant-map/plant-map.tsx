'use client'

import * as React from 'react'
import { PlantNode, type PlantNodeStatus } from './plant-node'
import { cn } from '../../utils/cn'

export type PlantMapPhase = 'inbound' | 'setup' | 'production' | 'qc' | 'outbound' | 'teardown'

export interface PlantMapZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  phase: PlantMapPhase
}

export interface PlantMapNode {
  id: string
  x: number
  y: number
  code: string
  name: string
  status?: PlantNodeStatus
  kpi?: string
}

export interface PlantMapProps {
  width: number
  height: number
  /** Background image URL (SVG / PNG). When omitted, a 64px solid grid is rendered. */
  background?: string
  zones?: PlantMapZone[]
  nodes: PlantMapNode[]
  selectedNodeId?: string
  onNodeClick?: (node: PlantMapNode) => void
  /** Optional content rendered in absolute position (toolbars, minimap, zoom). */
  children?: React.ReactNode
  className?: string
}

const PHASE_BORDER_COLOR: Record<PlantMapPhase, string> = {
  inbound: 'var(--c-inbound)',
  setup: 'var(--c-setup)',
  production: 'var(--c-production)',
  qc: 'var(--c-qc)',
  outbound: 'var(--c-outbound)',
  teardown: 'var(--c-teardown)',
}

export function PlantMap({
  width,
  height,
  background,
  zones,
  nodes,
  selectedNodeId,
  onNodeClick,
  children,
  className,
}: PlantMapProps) {
  const backgroundStyle: React.CSSProperties = background
    ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {
        backgroundImage:
          'linear-gradient(var(--ink-3) 1px, transparent 1px), linear-gradient(90deg, var(--ink-3) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        backgroundPosition: '0 0',
      }

  return (
    <div
      role="img"
      aria-label="Plant map"
      data-testid="plant-map"
      className={cn('relative overflow-hidden bg-paper-2', className)}
      style={{ width, height, ...backgroundStyle }}
    >
      {zones?.map((z) => {
        const color = PHASE_BORDER_COLOR[z.phase]
        return (
          <div
            key={z.id}
            data-zone={z.phase}
            className="absolute rounded-1 border border-dashed"
            style={{
              left: z.x,
              top: z.y,
              width: z.width,
              height: z.height,
              borderColor: color,
              backgroundColor: `color-mix(in oklch, ${color} 8%, transparent)`,
            }}
          >
            <span
              className="absolute top-1.5 left-2 text-[10px] uppercase tracking-wider font-semibold"
              style={{ color }}
            >
              {z.label}
            </span>
          </div>
        )
      })}

      {nodes.map((n) => (
        <PlantNode
          key={n.id}
          x={n.x}
          y={n.y}
          code={n.code}
          name={n.name}
          {...(n.status ? { status: n.status } : {})}
          {...(n.kpi ? { kpi: n.kpi } : {})}
          {...(selectedNodeId === n.id ? { selected: true } : {})}
          {...(onNodeClick ? { onClick: () => onNodeClick(n) } : {})}
        />
      ))}

      {children}
    </div>
  )
}
