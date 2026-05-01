'use client'

import type { ValidationError } from '@mes/domain'
import { useWorkflowStore } from './store'
import { useValidationContext } from './validation-context'

// Field paths come from validateWorkflowStructure as
// "phase.<id>.<...>", "group.<id>.<...>", "step.<id>.<...>", or "phases".
function parseField(field: string): { id: string; nodeType: string } | null {
  const match = field.match(/^(phase|group|step)\.([^.]+)/)
  if (!match) return null
  const kind = match[1]
  const id = match[2]
  if (!id) return null
  if (kind === 'phase') return { id, nodeType: 'phaseNode' }
  if (kind === 'group') return { id, nodeType: 'groupNode' }
  if (kind === 'step') return { id, nodeType: 'stepNode' }
  return null
}

export function ValidationPanel() {
  const selectNode = useWorkflowStore((s) => s.selectNode)
  const ctx = useValidationContext()

  if (!ctx) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs p-4 text-center">
        Validazione non disponibile fuori dal designer
      </div>
    )
  }

  const result = ctx.result

  function handleClick(error: ValidationError) {
    const parsed = parseField(error.field)
    if (!parsed) return
    selectNode(parsed.id, parsed.nodeType)
    const scroll = useWorkflowStore.getState().scrollToNode
    scroll?.(parsed.id)
  }

  if (result.ok) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2 text-xs text-emerald-700">
        <span className="text-2xl leading-none">✓</span>
        <span>Nessun errore</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="flex flex-col">
        {result.errors.map((err, idx) => {
          const parsed = parseField(err.field)
          return (
            <li key={`${err.field}-${idx}`}>
              <button
                type="button"
                onClick={() => handleClick(err)}
                disabled={!parsed}
                className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-50 disabled:hover:bg-transparent border-b border-neutral-100 flex items-start gap-2 disabled:cursor-default"
              >
                <span className="text-red-500 leading-tight">▲</span>
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-700">{err.message}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-mono truncate">
                    {err.field}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
