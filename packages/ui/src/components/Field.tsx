import * as React from 'react'
import { cn } from '../utils/cn'

export interface FieldProps {
  label: string
  hint?: string
  required?: boolean
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, hint, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-ink-2"
      >
        {label}
        {required && <span className="ml-0.5 text-bad">*</span>}
      </label>
      {children}
      {hint && <span className="text-sm text-ink-3">{hint}</span>}
    </div>
  )
}
