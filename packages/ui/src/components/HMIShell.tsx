import * as React from 'react'
import { cn } from '../utils/cn'

export interface HMIShellProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  sub?: React.ReactNode
  /** Optional content for the right side of the dark header (StatusBadge, label/value, etc.) */
  headerRight?: React.ReactNode
  /** Optional fixed footer area for sign-out / primary action / next-step CTA */
  footer?: React.ReactNode
  /** Body content (renders in the scrollable middle region) */
  children: React.ReactNode
}

/**
 * Tablet-optimized chrome for HMI (operator shop-floor) screens.
 *
 * Mirrors the `HMIShell` pattern from the Claude Design mockup
 * (`design-system/source/project/screens-5-hmi.jsx`):
 *
 *   - Dark header (high contrast for shop-floor visibility)
 *   - Scrollable body padded for spacious density
 *   - Optional light footer pinned to bottom for primary CTAs
 *
 * The header carries `data-theme="dark"` so design-token CSS variables
 * (`--paper`, `--ink`, `--ink-3`, `--line`) flip to their dark-mode values
 * within that subtree only. The body and footer remain in light mode.
 *
 * The root carries `data-mode="hmi"` so density tokens flip
 * (`--row-h: 56px`, base font 15px) per `tokens.css`.
 */
export function HMIShell({
  title,
  sub,
  headerRight,
  footer,
  children,
  className,
  ...rest
}: HMIShellProps) {
  return (
    <div
      data-mode="hmi"
      className={cn('h-full flex flex-col bg-paper', className)}
      {...rest}
    >
      <header
        data-theme="dark"
        className="bg-paper text-ink px-5 py-3 flex items-center justify-between flex-shrink-0"
      >
        <div className="min-w-0">
          {sub && (
            <div className="text-xs uppercase tracking-wider text-ink-3 truncate">
              {sub}
            </div>
          )}
          <div className="text-lg font-bold tracking-tight truncate">{title}</div>
        </div>
        {headerRight && (
          <div className="flex items-center gap-3 flex-shrink-0">{headerRight}</div>
        )}
      </header>
      <div className="flex-1 overflow-auto p-5">{children}</div>
      {footer && (
        <footer className="border-t border-line bg-paper-2 px-5 py-3 flex items-center justify-end gap-2 flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  )
}
