import * as React from 'react'
import { cn } from '../utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean | undefined
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[] | undefined
  placeholder?: string | undefined
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full rounded-2 border border-line bg-paper px-3 text-base text-ink',
        'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  ),
)
Select.displayName = 'Select'
