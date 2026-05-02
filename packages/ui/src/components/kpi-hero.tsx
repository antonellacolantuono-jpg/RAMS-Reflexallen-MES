'use client'

import * as React from 'react'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import { cn } from '../utils/cn'

export type KpiHeroTone = 'ok' | 'warn' | 'bad' | 'info' | 'accent' | 'neutral'
export type KpiHeroTrend = 'up' | 'down' | 'flat'

export interface KpiHeroProps {
  label: string
  value: string | number
  unit?: string
  sub?: string
  trend?: KpiHeroTrend
  trendLabel?: string
  tone?: KpiHeroTone
  big?: boolean
  ok?: boolean
  className?: string
}

const VALUE_TONE: Record<KpiHeroTone, string> = {
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad-ink',
  info: 'text-info-ink',
  accent: 'text-accent',
  neutral: 'text-ink',
}

const BORDER_TONE: Record<KpiHeroTone, string> = {
  ok: 'border-ok',
  warn: 'border-warn',
  bad: 'border-bad',
  info: 'border-info',
  accent: 'border-accent',
  neutral: 'border-line',
}

const TREND_TONE: Record<KpiHeroTrend, { Icon: typeof ArrowUp; cls: string }> = {
  up: { Icon: ArrowUp, cls: 'text-ok-ink' },
  down: { Icon: ArrowDown, cls: 'text-bad-ink' },
  flat: { Icon: ArrowRight, cls: 'text-ink-3' },
}

export function KpiHero({
  label,
  value,
  unit,
  sub,
  trend,
  trendLabel,
  tone,
  big,
  ok,
  className,
}: KpiHeroProps) {
  const resolvedTone: KpiHeroTone | undefined = tone ?? (ok ? 'ok' : undefined)
  const valueClass = resolvedTone ? VALUE_TONE[resolvedTone] : 'text-ink'
  const borderClass = resolvedTone ? BORDER_TONE[resolvedTone] : 'border-line'
  const trendMeta = trend ? TREND_TONE[trend] : null

  return (
    <div
      className={cn(
        'rounded-3 border bg-paper p-5',
        borderClass,
        className,
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold mb-2">
        {label}
      </div>
      <div
        className={cn(
          'font-mono font-semibold leading-none tabular-nums',
          big ? 'text-6xl' : 'text-5xl',
          valueClass,
        )}
      >
        {value}
        {unit && (
          <span className={cn('text-ink-3 ml-1', big ? 'text-2xl' : 'text-xl')}>{unit}</span>
        )}
      </div>
      {(sub || trendMeta) && (
        <div className="flex items-center justify-between mt-2.5 text-xs">
          {sub && <span className="text-ink-3">{sub}</span>}
          {trendMeta && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-mono tabular-nums',
                trendMeta.cls,
              )}
            >
              <trendMeta.Icon size={12} />
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
