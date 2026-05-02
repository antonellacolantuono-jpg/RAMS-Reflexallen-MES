'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface DetailHeaderProps {
  /** Breadcrumb trail; render whatever links the consumer needs (anchors, Next Link, buttons). */
  breadcrumb?: React.ReactNode
  /** Primary title (e.g. work order code rendered mono, or item name). */
  title: string
  /** Optional code shown alongside the title (mono). When present and `title` is the code, pass title only. */
  code?: string
  /** Pre-rendered status badge (e.g. <StatusBadge tone="ok">Released</StatusBadge>). */
  statusBadge?: React.ReactNode
  /** Pre-rendered priority badge. */
  priorityBadge?: React.ReactNode
  /** Optional subtitle line — short factual subline beneath the title row. */
  subtitle?: string
  /** Right-side action set (typically buttons, optionally a kebab). */
  actions?: React.ReactNode
  /** When true, the header sticks to the top of the scrolling container. */
  sticky?: boolean
  className?: string
}

export function DetailHeader({
  breadcrumb,
  title,
  code,
  statusBadge,
  priorityBadge,
  subtitle,
  actions,
  sticky,
  className,
}: DetailHeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-line bg-paper px-4 pt-3 pb-2',
        sticky && 'sticky top-0 z-10',
        className,
      )}
    >
      {breadcrumb && (
        <div className="text-xs text-ink-3 mb-1 flex items-center gap-1.5">{breadcrumb}</div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight font-mono text-ink truncate">
              {title}
            </h1>
            {code && code !== title && (
              <span className="font-mono text-sm text-ink-3">{code}</span>
            )}
            {statusBadge}
            {priorityBadge}
          </div>
          {subtitle && (
            <div className="mt-1 text-sm text-ink-2 truncate">{subtitle}</div>
          )}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
