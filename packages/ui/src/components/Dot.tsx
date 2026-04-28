import * as React from 'react'
import { cn } from '../utils/cn'

export type DotTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'accent'

const DOT_COLORS: Record<DotTone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  neutral: 'bg-ink-4',
  accent: 'bg-accent',
}

export interface DotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: DotTone
  size?: number
}

export function Dot({ tone = 'neutral', size = 8, className, style, ...props }: DotProps) {
  return (
    <span
      className={cn('dot inline-block rounded-full flex-shrink-0', DOT_COLORS[tone], className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  )
}
