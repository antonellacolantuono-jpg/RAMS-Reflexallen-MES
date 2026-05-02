'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

export type TreeNodeStatus = 'ok' | 'warn' | 'bad' | 'neutral'
export type TreeNodeMetricTone = 'ok' | 'warn' | 'bad' | 'info' | 'accent'

export interface TreeNodeMetric {
  value: number
  tone?: TreeNodeMetricTone
}

export interface TreeNodeProps {
  icon?: LucideIcon
  label: string
  sub?: string
  expanded?: boolean
  hasChildren?: boolean
  depth?: number
  selected?: boolean
  metric?: TreeNodeMetric
  status?: TreeNodeStatus
  match?: string
  onToggle?: () => void
  onClick?: () => void
}

const METRIC_BG: Record<TreeNodeMetricTone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  accent: 'bg-accent',
}

const STATUS_BG: Record<TreeNodeStatus, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  neutral: 'bg-neutral',
}

export function TreeNode({
  icon: Icon,
  label,
  sub,
  expanded,
  hasChildren,
  depth = 0,
  selected,
  metric,
  status,
  match,
  onToggle,
  onClick,
}: TreeNodeProps) {
  const labelNode = match ? renderHighlighted(label, match) : label

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? Boolean(expanded) : undefined}
      aria-selected={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        'flex items-center gap-2 h-8 pr-2 cursor-pointer text-sm rounded-1 outline-none focus-visible:ring-2 focus-visible:ring-accent',
        selected ? 'bg-accent-soft text-accent-ink' : 'hover:bg-paper-2',
      )}
      style={{ paddingLeft: 8 + depth * 16 }}
      data-depth={depth}
    >
      <span
        className="w-3 flex-shrink-0 flex items-center justify-center text-ink-3"
        onClick={(e) => {
          if (hasChildren && onToggle) {
            e.stopPropagation()
            onToggle()
          }
        }}
        aria-hidden
      >
        {hasChildren ? (
          <ChevronRight
            size={12}
            className={cn('motion-safe:transition-transform motion-safe:duration-150', expanded && 'rotate-90')}
          />
        ) : null}
      </span>
      {Icon && (
        <Icon
          size={13}
          className={cn('flex-shrink-0', selected ? 'text-accent' : 'text-ink-3')}
          aria-hidden
        />
      )}
      <span className="flex-1 min-w-0 truncate">
        {labelNode}
        {sub && <span className="text-xs text-ink-3 font-mono ml-2">{sub}</span>}
      </span>
      {metric && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-9 h-1 bg-paper-3 rounded-full overflow-hidden">
            <div
              className={cn('h-full', METRIC_BG[metric.tone ?? 'ok'])}
              style={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
            />
          </div>
          {status && <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_BG[status])} />}
        </div>
      )}
      {!metric && status && (
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', STATUS_BG[status])} />
      )}
    </div>
  )
}

function renderHighlighted(text: string, match: string): React.ReactNode {
  if (!match) return text
  const lower = match.toLowerCase()
  const parts = text.split(new RegExp(`(${escapeRegExp(match)})`, 'i'))
  return parts.map((part, i) =>
    part.toLowerCase() === lower ? (
      <mark key={i} className="bg-warn-soft text-ink px-0.5 rounded-sm">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  )
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
