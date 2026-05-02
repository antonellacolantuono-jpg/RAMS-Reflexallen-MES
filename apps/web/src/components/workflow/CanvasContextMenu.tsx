'use client'

import { useEffect, useRef } from 'react'
import { useWorkflowStore } from './store'

export interface CanvasContextMenuState {
  x: number
  y: number
  nodeId: string
  nodeType: string
}

export interface CanvasContextMenuProps {
  state: CanvasContextMenuState | null
  onClose: () => void
}

export function CanvasContextMenu({ state, onClose }: CanvasContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const deleteNode = useWorkflowStore((s) => s.deleteNode)
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode)
  const openAddStepDialog = useWorkflowStore((s) => s.openAddStepDialog)

  useEffect(() => {
    if (!state) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [state, onClose])

  if (!state) return null

  const isStep = state.nodeType === 'stepNode'
  const isGroup = state.nodeType === 'groupNode'

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[180px] rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
      style={{ top: state.y, left: state.x }}
    >
      {isGroup && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            openAddStepDialog({ groupId: state.nodeId })
            onClose()
          }}
          className="block w-full px-3 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
        >
          Aggiungi Step
        </button>
      )}
      {isStep && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            duplicateNode(state.nodeId)
            onClose()
          }}
          className="block w-full px-3 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
        >
          Duplica
          <span className="ml-2 text-xs text-neutral-400">Ctrl+D</span>
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          deleteNode(state.nodeId)
          onClose()
        }}
        className="block w-full px-3 py-1.5 text-left text-sm text-error-700 hover:bg-error-50"
      >
        Elimina
        <span className="ml-2 text-xs text-neutral-400">Canc</span>
      </button>
    </div>
  )
}
