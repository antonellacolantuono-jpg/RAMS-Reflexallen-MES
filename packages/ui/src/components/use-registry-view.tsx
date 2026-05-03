'use client'

import * as React from 'react'
import { ViewSwitcher, type ViewMode } from './view-switcher'

const STORAGE_PREFIX = 'rams.view.'

export interface UseRegistryViewOptions {
  /** Stable identifier for this registry (drives the localStorage key). */
  registryId: string
  /** Views the user is allowed to pick. Must contain at least one entry. */
  availableViews: ViewMode[]
  /**
   * View to use on first load when no value is stored yet. Falls back to
   * `availableViews[0]` when omitted.
   */
  defaultView?: ViewMode
  /** Optional callback fired whenever the view changes (post-state-update). */
  onChange?: (next: ViewMode) => void
}

export interface UseRegistryViewResult {
  /** The current view mode, persisted across sessions per `registryId`. */
  view: ViewMode
  /** Update the view mode (also writes to localStorage and fires `onChange`). */
  setView: (next: ViewMode) => void
  /**
   * Pre-rendered ViewSwitcher element wired to the current state.
   * Returns `null` when only one view is available (the toggle would be a
   * no-op so it stays hidden).
   */
  switcher: React.ReactElement | null
}

function readStored(registryId: string, allowed: ViewMode[]): ViewMode | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + registryId)
    if (raw && (allowed as string[]).includes(raw)) return raw as ViewMode
    return null
  } catch {
    // Private browsing / quota — fall through to default.
    return null
  }
}

function writeStored(registryId: string, view: ViewMode): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + registryId, view)
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/**
 * Per-registry view-mode persistence on top of `ViewSwitcher`.
 *
 * Stores the operator's chosen view (List / Card / Flow / etc.) in
 * `localStorage` under the namespaced key `rams.view.<registryId>`,
 * so revisiting a registry restores the prior view.
 *
 * SSR-safe: the first render returns `defaultView` (or `availableViews[0]`),
 * and the stored value is read in an effect on the client to avoid hydration
 * mismatches.
 *
 * Caller wiring is two lines:
 *
 *   const { view, switcher } = useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] })
 *   // …then render `switcher` in the page header and branch on `view` for the body
 *
 * `switcher` is `null` when only one view is available — the page can render
 * it unconditionally and a single-view registry just shows nothing.
 */
export function useRegistryView({
  registryId,
  availableViews,
  defaultView,
  onChange,
}: UseRegistryViewOptions): UseRegistryViewResult {
  if (availableViews.length === 0) {
    throw new Error('useRegistryView: availableViews must contain at least one view')
  }
  const initial: ViewMode =
    defaultView && availableViews.includes(defaultView)
      ? defaultView
      : (availableViews[0] as ViewMode)

  const [view, setViewState] = React.useState<ViewMode>(initial)

  React.useEffect(() => {
    const stored = readStored(registryId, availableViews)
    if (stored && stored !== view) {
      setViewState(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryId])

  const setView = React.useCallback(
    (next: ViewMode) => {
      setViewState(next)
      writeStored(registryId, next)
      onChange?.(next)
    },
    [registryId, onChange],
  )

  const switcher =
    availableViews.length > 1 ? (
      <ViewSwitcher value={view} onChange={setView} views={availableViews} />
    ) : null

  return { view, setView, switcher }
}
