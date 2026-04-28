import * as React from 'react'
import { cn } from '../utils/cn'

export interface FieldProps {
  label: string
  hint?: string | undefined
  error?: string | undefined
  required?: boolean | undefined
  htmlFor?: string | undefined
  className?: string | undefined
  children: React.ReactNode
}

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-bad">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-error-600">{error}</span>}
      {hint && !error && <span className="text-xs text-neutral-500">{hint}</span>}
    </div>
  )
}
