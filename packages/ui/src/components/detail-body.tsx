'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface DetailBodyProps {
  /** Main content column. */
  main: React.ReactNode
  /** Optional sidebar (right rail). When omitted, main expands to full width. */
  sidebar?: React.ReactNode
  /** Sidebar width in px (desktop only). Default 320. */
  sidebarWidth?: number
  /** When true, the sidebar sticks to the top while the main column scrolls. */
  stickySidebar?: boolean
  /** Mobile breakpoint (px). Below this, layout stacks vertically. Default 800. */
  mobileBreakpoint?: number
  className?: string
}

const DEFAULT_SIDEBAR_WIDTH = 320
const DEFAULT_MOBILE_BREAKPOINT = 800

export function DetailBody({
  main,
  sidebar,
  sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
  stickySidebar,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  className,
}: DetailBodyProps) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    function check() {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [mobileBreakpoint])

  if (!sidebar) {
    return <div className={cn('flex-1 overflow-auto', className)}>{main}</div>
  }

  if (isMobile) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div className="overflow-auto">{main}</div>
        <aside className="border-t border-line bg-paper-2">{sidebar}</aside>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full', className)}>
      <div className="flex-1 overflow-auto">{main}</div>
      <aside
        style={{ width: sidebarWidth }}
        className={cn(
          'flex-shrink-0 overflow-auto bg-paper-2 border-l border-line',
          stickySidebar && 'sticky top-0 self-start max-h-screen',
        )}
        data-testid="detail-body-sidebar"
      >
        {sidebar}
      </aside>
    </div>
  )
}
