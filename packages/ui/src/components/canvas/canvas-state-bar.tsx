'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

export type CanvasStateTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

const TONE_DOT: Record<CanvasStateTone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  neutral: 'bg-neutral',
}

export interface CanvasStateBarProps {
  /** Status dot tone. Default neutral. */
  tone?: CanvasStateTone
  /** Status label (e.g. "Unsaved changes"). */
  status: string
  /** Optional count summary, e.g. "12 nodes · 14 edges". */
  counts?: string
  /** Right-aligned action slot (typically Undo / Save buttons). */
  actions?: React.ReactNode
  className?: string
}

export function CanvasStateBar({
  tone = 'neutral',
  status,
  counts,
  actions,
  className,
}: CanvasStateBarProps) {
  return (
    <div
      role="status"
      aria-label="Stato canvas"
      className={cn(
        'absolute top-3 right-3 inline-flex items-center gap-2 rounded-1 border border-line bg-paper px-2 h-8 text-[11px]',
        className,
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])} />
      <span className="text-ink-2">{status}</span>
      {counts && (
        <>
          <span className="text-ink-3" aria-hidden>·</span>
          <span className="font-mono tabular-nums text-ink-3">{counts}</span>
        </>
      )}
      {actions && (
        <>
          <span className="text-ink-3" aria-hidden>·</span>
          <div className="inline-flex items-center gap-1">{actions}</div>
        </>
      )}
    </div>
  )
}
