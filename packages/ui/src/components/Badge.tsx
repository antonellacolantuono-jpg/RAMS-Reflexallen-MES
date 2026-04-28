import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-sm font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-neutral-soft text-ink-2',
        ok: 'bg-ok-soft text-ok-ink',
        warn: 'bg-warn-soft text-warn-ink',
        bad: 'bg-bad-soft text-bad-ink',
        info: 'bg-info-soft text-info-ink',
        accent: 'bg-accent-soft text-accent-ink',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-ink-3': tone === 'neutral',
            'bg-ok': tone === 'ok',
            'bg-warn': tone === 'warn',
            'bg-bad': tone === 'bad',
            'bg-info': tone === 'info',
            'bg-accent': tone === 'accent',
          })}
        />
      )}
      {children}
    </span>
  )
}
