'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export type LiveAlertTone = 'ok' | 'warn' | 'bad' | 'info'

const TONE_DOT: Record<LiveAlertTone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
}

export interface LiveAlertProps {
  tone: LiveAlertTone
  message: string
  time: string
  isNew?: boolean
  className?: string
}

export function LiveAlert({ tone, message, time, isNew, className }: LiveAlertProps) {
  return (
    <div className={cn('flex items-start gap-2.5 text-xs', className)} data-tone={tone}>
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0',
          TONE_DOT[tone],
          isNew && 'motion-safe:animate-pulse',
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-ink">{message}</div>
        <div className="font-mono text-[10.5px] text-ink-3 mt-0.5 tabular-nums">{time}</div>
      </div>
    </div>
  )
}
