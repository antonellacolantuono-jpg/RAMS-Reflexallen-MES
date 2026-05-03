import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const hmiBigBtnVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  {
    variants: {
      variant: {
        default: 'bg-paper border-2 border-line text-ink hover:border-ink-4',
        /**
         * Primary HMI CTA — uses Tailwind amber for the warm "go ahead" tone
         * the mockup chose for shop-floor primary actions (e.g. "Start cycle",
         * "Sign in"). Amber is intentionally outside the design-token palette
         * (which centers on the violet `--accent`); the HMI palette diverges
         * here to maximize visibility under shop-floor lighting.
         */
        primary: 'bg-amber-500 text-ink hover:bg-amber-400 shadow-md',
        success: 'bg-ok text-paper hover:bg-ok/90 shadow-md',
        danger: 'bg-bad text-paper hover:bg-bad/90 shadow-md',
      },
      size: {
        default: 'h-12 px-5 text-base rounded-2',
        big: 'h-16 px-6 text-lg rounded-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface HMIBigBtnProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof hmiBigBtnVariants> {
  icon?: React.ReactNode
}

/**
 * Tablet-optimized touch CTA for HMI screens.
 *
 * Mirrors the `HMIBigBtn` pattern from the Claude Design mockup
 * (`design-system/source/project/screens-5-hmi.jsx`).
 *
 *   - `size="default"` → h-12 (48px), meets the 44px touch-target floor
 *   - `size="big"` → h-16 (64px), reserved for primary footer CTAs
 *     (e.g. "Sign in", "Confirm OK · Next →")
 *
 * Distinct from `Button size="hmi"` because the mockup intentionally
 * separates the back-office Btn family from the HMI tablet family —
 * different visual identity (warm amber primary vs. cool accent),
 * different size ladder, different shadow treatment.
 */
export const HMIBigBtn = React.forwardRef<HTMLButtonElement, HMIBigBtnProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(hmiBigBtnVariants({ variant, size }), className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
)
HMIBigBtn.displayName = 'HMIBigBtn'
