'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'
import { useFocusTrap } from '../utils/focus-trap'

export interface DrawerProps {
  open?: boolean | undefined
  onClose?: (() => void) | undefined
  title?: string | undefined
  subtitle?: string | undefined
  width?: number | undefined
  children?: React.ReactNode
  footer?: React.ReactNode
  actions?: React.ReactNode
  className?: string | undefined
}

export function Drawer({
  open = false,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
  footer,
  actions,
  className,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (open) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useFocusTrap(open, panelRef)

  if (!mounted || !visible) return null

  const footerNode = actions ?? footer

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className={cn(
          'absolute inset-0 bg-black/30 backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        className={cn(
          'relative ml-auto flex h-full flex-col bg-white shadow-2xl motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
        style={{ width }}
        role="dialog"
        aria-modal
        aria-label={title}
        tabIndex={-1}
      >
        {(title || subtitle || onClose) && (
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold text-neutral-900 truncate">{title}</h2>}
              {subtitle && (
                <div className="text-xs text-ink-3 font-mono mt-0.5 truncate">{subtitle}</div>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 ml-3 shrink-0"
                aria-label="Chiudi"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footerNode && (
          <div className="border-t border-neutral-200 px-5 py-4 shrink-0">{footerNode}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
