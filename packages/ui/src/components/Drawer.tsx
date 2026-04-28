'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'

export interface DrawerProps {
  open?: boolean | undefined
  onClose?: (() => void) | undefined
  title?: string | undefined
  width?: number | undefined
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string | undefined
}

export function Drawer({ open = false, onClose, title, width = 480, children, footer, className }: DrawerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

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

  if (!mounted || !visible) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'relative ml-auto flex h-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
        style={{ width }}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
            {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                aria-label="Chiudi"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-neutral-200 px-5 py-4 shrink-0">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
