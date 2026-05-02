'use client'

import * as React from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Trap keyboard focus inside the referenced container while `active` is true.
 * On activation: stores the previously-focused element, focuses the first focusable
 * inside the container (or the container itself).
 * On deactivation: restores focus to the previously-focused element.
 * Tab / Shift+Tab cycle within the container.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  ref: React.RefObject<T | null>,
): void {
  React.useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const firstFocusable = focusables[0]
    if (firstFocusable) {
      firstFocusable.focus()
    } else if (typeof node.focus === 'function') {
      node.focus()
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (!ref.current) return
      const els = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      const first = els[0]
      const last = els[els.length - 1]
      if (!first || !last) {
        e.preventDefault()
        return
      }
      const activeEl = document.activeElement as HTMLElement | null

      if (e.shiftKey && (activeEl === first || !ref.current.contains(activeEl))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || !ref.current.contains(activeEl))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [active, ref])
}
