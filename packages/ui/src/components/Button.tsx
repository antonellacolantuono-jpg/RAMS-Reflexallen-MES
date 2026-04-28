import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent/90',
        secondary: 'bg-paper-3 text-ink hover:bg-line',
        ghost: 'bg-transparent text-ink hover:bg-paper-2',
        danger: 'bg-bad text-white hover:bg-bad/90',
      },
      size: {
        sm: 'h-7 px-2.5 text-sm',
        md: 'h-9 px-3.5 text-base',
        lg: 'h-11 px-5 text-lg',
        hmi: 'h-14 px-6 text-xl min-w-[56px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode
  iconR?: React.ReactNode
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon, iconR, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
      {!loading && iconR}
    </button>
  ),
)
Button.displayName = 'Button'
