'use client'

import { useEffect } from 'react'
import { useWorkflowStore } from './store'

function isFocusInEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

/**
 * Global keyboard shortcuts for the workflow canvas.
 * Skipped when focus is inside form fields (input/textarea/contenteditable)
 * so the configurator forms can keep accepting keystrokes naturally.
 *
 *   Del / Backspace → delete selected node
 *   Ctrl/Cmd+D      → duplicate selected step node
 *   Ctrl/Cmd+Z      → undo
 *   Ctrl/Cmd+Shift+Z → redo
 */
export function useCanvasKeyboardShortcuts(): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isFocusInEditableElement(e.target)) return

      const { selectedNodeId, deleteNode, duplicateNode, undo, redo } =
        useWorkflowStore.getState()
      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectedNodeId) return
        e.preventDefault()
        deleteNode(selectedNodeId)
        return
      }

      if (mod && (e.key === 'd' || e.key === 'D')) {
        if (!selectedNodeId) return
        e.preventDefault()
        duplicateNode(selectedNodeId)
        return
      }

      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
