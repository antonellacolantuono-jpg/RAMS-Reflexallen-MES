'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface Breadcrumb {
  label: string
  href?: string | undefined
}

export interface EntityTab {
  key: string
  label: string
  content: React.ReactNode
}

export interface EntityDetailProps {
  breadcrumbs?: Breadcrumb[] | undefined
  title: string
  subtitle?: string | undefined
  badge?: React.ReactNode | undefined
  actions?: React.ReactNode | undefined
  tabs: EntityTab[]
  defaultTab?: string | undefined
  /** PROMPT_15 — controlled mode for URL-synced tab selection. Pair with onTabChange. */
  activeTab?: string | undefined
  onTabChange?: ((key: string) => void) | undefined
  isLoading?: boolean | undefined
  className?: string | undefined
  onNavigate?: ((href: string) => void) | undefined
}

export function EntityDetail({
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  actions,
  tabs,
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
  isLoading,
  className,
  onNavigate,
}: EntityDetailProps) {
  const [internalTab, setInternalTab] = React.useState(defaultTab ?? tabs[0]?.key ?? '')
  const isControlled = controlledTab !== undefined
  const activeTab = isControlled ? controlledTab : internalTab
  const setActiveTab = (key: string) => {
    if (!isControlled) setInternalTab(key)
    onTabChange?.(key)
  }

  const currentTab = tabs.find((t) => t.key === activeTab) ?? tabs[0]

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div className="h-4 w-48 bg-neutral-100 rounded animate-pulse" />
        <div className="h-7 w-72 bg-neutral-100 rounded animate-pulse" />
        <div className="h-9 w-full bg-neutral-100 rounded animate-pulse" />
        <div className="h-64 w-full bg-neutral-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-neutral-500">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <button
                  type="button"
                  className="hover:text-neutral-800 hover:underline"
                  onClick={() => crumb.href && onNavigate?.(crumb.href)}
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-neutral-800 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title bar */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-neutral-900 truncate">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex border-b border-neutral-200 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab.key === activeTab
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="pt-4">{currentTab?.content}</div>
    </div>
  )
}
