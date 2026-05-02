'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

export type AlertBannerTone = 'ok' | 'warn' | 'bad' | 'info'

interface AlertCTA {
  label: string
  onClick: () => void
}

const TONE_BG: Record<AlertBannerTone, string> = {
  ok: 'bg-ok-soft',
  warn: 'bg-warn-soft',
  bad: 'bg-bad-soft',
  info: 'bg-info-soft',
}

const TONE_BORDER: Record<AlertBannerTone, string> = {
  ok: 'border-ok',
  warn: 'border-warn',
  bad: 'border-bad',
  info: 'border-info',
}

const TONE_INK: Record<AlertBannerTone, string> = {
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad-ink',
  info: 'text-info-ink',
}

const TONE_ICON: Record<AlertBannerTone, LucideIcon> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  bad: XCircle,
  info: Info,
}

const TONE_ROLE: Record<AlertBannerTone, 'alert' | 'status'> = {
  ok: 'status',
  warn: 'alert',
  bad: 'alert',
  info: 'status',
}

export interface AlertBannerProps {
  tone?: AlertBannerTone
  kicker?: string
  title: string
  body?: string
  cta?: AlertCTA
  className?: string
}

export function AlertBanner({ tone = 'bad', kicker, title, body, cta, className }: AlertBannerProps) {
  const Icon = TONE_ICON[tone]
  return (
    <div
      role={TONE_ROLE[tone]}
      className={cn(
        'rounded-3 border-[1.5px] p-4',
        TONE_BG[tone],
        TONE_BORDER[tone],
        className,
      )}
      data-tone={tone}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'w-10 h-10 rounded-2 bg-paper border flex items-center justify-center flex-shrink-0',
            TONE_BORDER[tone],
          )}
        >
          <Icon size={20} className={TONE_INK[tone]} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          {kicker && (
            <div
              className={cn('text-[10px] uppercase tracking-wider font-semibold mb-0.5', TONE_INK[tone])}
            >
              {kicker}
            </div>
          )}
          <div className="text-base font-semibold text-ink">{title}</div>
          {body && <div className="text-xs text-ink-2 mt-1">{body}</div>}
        </div>
        {cta && (
          <button
            type="button"
            onClick={cta.onClick}
            className={cn(
              'rounded-1 border bg-paper px-3 py-1.5 text-xs font-medium hover:bg-paper-2 flex-shrink-0',
              TONE_BORDER[tone],
              TONE_INK[tone],
            )}
          >
            {cta.label}
          </button>
        )}
      </div>
    </div>
  )
}
