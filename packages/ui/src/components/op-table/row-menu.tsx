'use client'

import * as React from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

export type RowMenuTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

export interface RowMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  tone?: RowMenuTone
  kbd?: string
  divider?: boolean
  onClick: () => void
}

const TONE_CLASS: Record<RowMenuTone, string> = {
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad-ink',
  info: 'text-info-ink',
  neutral: 'text-ink',
}

export interface RowMenuProps {
  items: RowMenuItem[]
  ariaLabel?: string
  className?: string
}

export function RowMenu({ items, ariaLabel = 'Azioni riga', className }: RowMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="w-7 h-7 inline-flex items-center justify-center text-ink-3 hover:text-ink hover:bg-paper-2 rounded-sm"
      >
        <MoreHorizontal size={13} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-7 z-20 w-[200px] rounded-2 bg-paper border border-line py-1 shadow-lg"
        >
          {items.map((it, i) => {
            const Icon = it.icon
            return (
              <React.Fragment key={it.id}>
                {it.divider && i > 0 && <div className="border-t border-line my-1" aria-hidden />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    it.onClick()
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-2.5 h-7 flex items-center gap-2 text-xs hover:bg-paper-2',
                    it.tone ? TONE_CLASS[it.tone] : 'text-ink',
                  )}
                >
                  {Icon && (
                    <Icon
                      size={12}
                      className={it.tone ? TONE_CLASS[it.tone] : 'text-ink-3'}
                    />
                  )}
                  <span className="flex-1">{it.label}</span>
                  {it.kbd && <span className="font-mono text-[10px] text-ink-3">{it.kbd}</span>}
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
