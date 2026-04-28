import * as React from 'react'
import { cn } from '../utils/cn'

export type KPITone = 'default' | 'ok' | 'warn' | 'bad' | 'info'
export type KPITrend = 'up' | 'down' | 'flat'

const VALUE_COLORS: Record<KPITone, string> = {
  default: 'text-ink',
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad-ink',
  info: 'text-info-ink',
}

const TREND_ICONS: Record<KPITrend, string> = { up: '↑', down: '↓', flat: '→' }
const TREND_COLORS: Record<KPITrend, string> = {
  up: 'text-ok',
  down: 'text-bad',
  flat: 'text-ink-3',
}

export interface KPIProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  unit?: string
  trend?: KPITrend
  tone?: KPITone
  sub?: string
}

export function KPI({
  label,
  value,
  unit,
  trend,
  tone = 'default',
  sub,
  className,
  ...props
}: KPIProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)} {...props}>
      <span className="text-sm text-ink-3 font-medium">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-semibold tabular-nums', VALUE_COLORS[tone])}>
          {value}
        </span>
        {unit && <span className="text-sm text-ink-3">{unit}</span>}
        {trend && (
          <span className={cn('text-sm font-medium ml-1', TREND_COLORS[trend])}>
            {TREND_ICONS[trend]}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-ink-4">{sub}</span>}
    </div>
  )
}
