'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'
import { useFocusTrap } from '../utils/focus-trap'

export interface ModalProps {
  open?: boolean | undefined
  onClose?: (() => void) | undefined
  title?: string | undefined
  description?: string | undefined
  width?: number | undefined
  children?: React.ReactNode
  footer?: React.ReactNode
  actions?: React.ReactNode
  className?: string | undefined
}

export interface ConfirmModalProps {
  open?: boolean | undefined
  onClose?: (() => void) | undefined
  onConfirm?: (() => void) | undefined
  title?: string | undefined
  description?: string | undefined
  confirmLabel?: string | undefined
  cancelLabel?: string | undefined
  variant?: 'danger' | 'default' | undefined
  isLoading?: boolean | undefined
}

export function Modal({
  open = false,
  onClose,
  title,
  description,
  width = 480,
  children,
  footer,
  actions,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const dialogRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (open) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 150)
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

  React.useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  useFocusTrap(open, dialogRef)

  if (!mounted || !visible) return null

  const footerNode = actions ?? footer

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          'absolute inset-0 bg-black/40 motion-safe:transition-opacity motion-safe:duration-150',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={dialogRef}
        className={cn(
          'relative flex max-h-[90vh] flex-col rounded-xl bg-white shadow-2xl motion-safe:transition-all motion-safe:duration-150',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          className,
        )}
        style={{ width, maxWidth: '95vw' }}
        role="dialog"
        aria-modal
        aria-label={title}
        tabIndex={-1}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
            <div>
              {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-4 rounded-md p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 shrink-0"
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
          <div className="border-t border-neutral-200 px-5 py-4 shrink-0 flex justify-end gap-2">
            {footerNode}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Conferma',
  description,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  variant = 'default',
  isLoading,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width={400}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-md px-3.5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
              variant === 'danger'
                ? 'bg-error-600 hover:bg-error-700'
                : 'bg-primary-600 hover:bg-primary-700',
            )}
          >
            {isLoading ? 'Attendere…' : confirmLabel}
          </button>
        </>
      }
    />
  )
}
