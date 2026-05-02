'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'

export type AuditTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

export interface AuditDiffLine {
  field: string
  before: string
  after: string
}

export interface AuditTimelineEntry {
  id: string
  at: Date
  actor: string
  action: string
  entity?: string
  diff?: AuditDiffLine[]
  tone?: AuditTone
}

export interface AuditTimelineProps {
  entries: AuditTimelineEntry[]
  emptyMessage?: string
  className?: string
}

const DOT_BG: Record<AuditTone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  neutral: 'bg-neutral',
}

const DOT_BORDER: Record<AuditTone, string> = {
  ok: 'border-ok',
  warn: 'border-warn',
  bad: 'border-bad',
  info: 'border-info',
  neutral: 'border-line',
}

function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function AuditTimeline({
  entries,
  emptyMessage = 'Nessun evento registrato',
  className,
}: AuditTimelineProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (entries.length === 0) {
    return (
      <div className={cn('p-6 text-center text-sm text-ink-3', className)}>{emptyMessage}</div>
    )
  }

  return (
    <ol className={cn('relative', className)} aria-label="Audit log">
      <span
        aria-hidden
        className="absolute left-[11px] top-2 bottom-2 w-px bg-line"
      />
      {entries.map((e) => {
        const tone = e.tone ?? 'neutral'
        const isOpen = expanded.has(e.id)
        const hasDiff = Boolean(e.diff && e.diff.length > 0)

        return (
          <li key={e.id} className="relative pl-8 pb-4 last:pb-0" data-tone={tone}>
            <span
              aria-hidden
              className={cn(
                'absolute left-1 top-1.5 h-3 w-3 rounded-full border-2 bg-paper',
                DOT_BORDER[tone],
              )}
            >
              <span className={cn('block h-full w-full rounded-full', DOT_BG[tone])} />
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <time
                dateTime={e.at.toISOString()}
                className="font-mono text-xs text-ink-3 tabular-nums"
                title={`${formatDate(e.at)} ${formatTime(e.at)}`}
              >
                {formatTime(e.at)}
              </time>
              <span className="text-xs font-semibold text-ink">{e.actor}</span>
              <span className="text-sm text-ink-2">{e.action}</span>
              {e.entity && (
                <span className="font-mono text-[10.5px] text-ink-3">{e.entity}</span>
              )}
              {hasDiff && (
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  aria-expanded={isOpen}
                  aria-controls={`audit-diff-${e.id}`}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] text-accent-ink hover:underline"
                >
                  {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  {isOpen ? 'Nascondi' : 'Mostra'} diff
                </button>
              )}
            </div>
            {hasDiff && isOpen && (
              <ul
                id={`audit-diff-${e.id}`}
                className="mt-1.5 space-y-0.5 text-xs"
              >
                {e.diff!.map((d, i) => (
                  <li key={i} className="font-mono">
                    <span className="text-ink-3">{d.field}:</span>{' '}
                    <span className="line-through text-bad-ink">{d.before}</span>
                    {/* Unicode U+2192 RIGHTWARDS ARROW (verbatim, not escape sequence) */}
                    <span className="mx-1 text-ink-3">{'→'}</span>
                    <span className="text-ok-ink">{d.after}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
