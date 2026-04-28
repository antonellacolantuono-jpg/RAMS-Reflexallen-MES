import * as React from 'react'
import { cn } from '../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  required?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, required, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-2">
            {label}
            {required && <span className="ml-0.5 text-bad">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-9 w-full rounded-2 border border-line bg-paper px-3 text-base text-ink placeholder:text-ink-4 transition-colors',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            error && 'border-bad focus:border-bad focus:ring-bad',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${inputId}-hint` : undefined}
          {...props}
        />
        {(hint ?? error) && (
          <span
            id={`${inputId}-hint`}
            className={cn('text-sm', error ? 'text-bad' : 'text-ink-3')}
          >
            {error ?? hint}
          </span>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
