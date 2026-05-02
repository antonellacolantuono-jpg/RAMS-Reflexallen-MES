'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface SplitViewProps {
  tree: React.ReactNode
  detail: React.ReactNode
  treeWidth?: number
  minTreeWidth?: number
  maxTreeWidth?: number
  mobileBreakpoint?: number
  className?: string
}

const DEFAULT_TREE_WIDTH = 260
const DEFAULT_MIN = 200
const DEFAULT_MAX = 420
const DEFAULT_MOBILE_BREAKPOINT = 800

export function SplitView({
  tree,
  detail,
  treeWidth: initialWidth = DEFAULT_TREE_WIDTH,
  minTreeWidth = DEFAULT_MIN,
  maxTreeWidth = DEFAULT_MAX,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  className,
}: SplitViewProps) {
  const clamp = React.useCallback(
    (n: number) => Math.max(minTreeWidth, Math.min(maxTreeWidth, n)),
    [minTreeWidth, maxTreeWidth],
  )
  const [width, setWidth] = React.useState<number>(() => clamp(initialWidth))
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [showTree, setShowTree] = React.useState<boolean>(true)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    function check() {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [mobileBreakpoint])

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    function onMove(ev: MouseEvent) {
      setWidth(clamp(startWidth + (ev.clientX - startX)))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  if (isMobile) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 overflow-auto">{showTree ? tree : detail}</div>
        <button
          type="button"
          onClick={() => setShowTree((v) => !v)}
          className="border-t border-line h-10 text-sm font-medium text-ink hover:bg-paper-2"
        >
          {showTree ? 'Mostra dettaglio' : 'Mostra albero'}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full', className)}>
      <div
        style={{ width }}
        className="flex-shrink-0 overflow-auto border-r border-line"
        data-testid="split-view-tree"
      >
        {tree}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Ridimensiona pannello"
        aria-valuenow={width}
        aria-valuemin={minTreeWidth}
        aria-valuemax={maxTreeWidth}
        tabIndex={0}
        onMouseDown={onDragStart}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setWidth((w) => clamp(w - 16))
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setWidth((w) => clamp(w + 16))
          }
        }}
        className="w-1 cursor-col-resize bg-transparent hover:bg-line motion-safe:transition-colors"
      />
      <div className="flex-1 overflow-auto">{detail}</div>
    </div>
  )
}

export function useSplitViewSelection(
  key: string,
): [string | null, (id: string | null) => void] {
  const [selection, setSelection] = React.useState<string | null>(() => readHash(key))

  React.useEffect(() => {
    function onHash() {
      setSelection(readHash(key))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [key])

  const update = React.useCallback(
    (id: string | null) => {
      setSelection(id)
      if (typeof window === 'undefined') return
      if (id) {
        window.location.hash = `${key}-${id}`
      } else if (window.location.hash.startsWith(`#${key}-`)) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    },
    [key],
  )

  return [selection, update]
}

function readHash(key: string): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.slice(1)
  const prefix = `${key}-`
  if (hash.startsWith(prefix)) return hash.slice(prefix.length)
  return null
}
