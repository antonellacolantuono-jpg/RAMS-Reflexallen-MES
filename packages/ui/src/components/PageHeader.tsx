import * as React from 'react'
import { cn } from '../utils/cn'

export interface PageHeaderProps {
  title: string
  subtitle?: string | undefined
  actions?: React.ReactNode
  className?: string | undefined
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-4', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight text-neutral-900 truncate">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-neutral-500 truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
