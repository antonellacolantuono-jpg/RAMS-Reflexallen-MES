'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'

export type ToastVariant = 'ok' | 'warn' | 'bad' | 'info'

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
}

export interface ToastOptions {
  duration?: number
}

export interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, options?: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  show: () => '',
  dismiss: () => undefined,
})

const MAX_VISIBLE = 3
const DEFAULT_DURATION_MS = 4000

const VARIANT_CLASS: Record<ToastVariant, string> = {
  ok: 'border-l-4 border-l-ok',
  warn: 'border-l-4 border-l-warn',
  bad: 'border-l-4 border-l-bad',
  info: 'border-l-4 border-l-info',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [mounted, setMounted] = React.useState(false)
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  React.useEffect(() => {
    setMounted(true)
    const t = timers.current
    return () => {
      for (const handle of t.values()) clearTimeout(handle)
      t.clear()
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const handle = timers.current.get(id)
    if (handle) {
      clearTimeout(handle)
      timers.current.delete(id)
    }
  }, [])

  const show = React.useCallback(
    (message: string, variant: ToastVariant = 'info', options?: ToastOptions): string => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => {
        const next = [...prev, { id, message, variant }]
        if (next.length <= MAX_VISIBLE) return next
        const overflow = next.slice(0, next.length - MAX_VISIBLE)
        for (const dropped of overflow) {
          const h = timers.current.get(dropped.id)
          if (h) {
            clearTimeout(h)
            timers.current.delete(dropped.id)
          }
        }
        return next.slice(-MAX_VISIBLE)
      })

      const duration = options?.duration ?? DEFAULT_DURATION_MS
      if (duration > 0) {
        const handle = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, handle)
      }
      return id
    },
    [dismiss],
  )

  const value = React.useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
            role="region"
            aria-label="Notifiche"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                aria-live="polite"
                className={cn(
                  'pointer-events-auto min-w-[260px] rounded-lg bg-white shadow-lg px-4 py-3 border border-neutral-200 motion-safe:transition-opacity motion-safe:duration-150',
                  VARIANT_CLASS[t.variant ?? 'info'],
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 text-sm text-neutral-800">{t.message}</div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    className="text-neutral-400 hover:text-neutral-600 shrink-0"
                    aria-label="Chiudi notifica"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return React.useContext(ToastContext)
}
