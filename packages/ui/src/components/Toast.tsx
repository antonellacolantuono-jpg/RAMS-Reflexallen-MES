'use client'

import * as React from 'react'

export type ToastVariant = 'ok' | 'warn' | 'bad' | 'info'

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
}

export interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  show: () => undefined,
  dismiss: () => undefined,
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastContext.Provider value={{ show: () => undefined, dismiss: () => undefined }}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  return React.useContext(ToastContext)
}
