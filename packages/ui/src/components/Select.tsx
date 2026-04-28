import * as React from 'react'
import { cn } from '../utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full rounded-2 border border-line bg-paper px-3 text-base text-ink',
        'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
)
Select.displayName = 'Select'
