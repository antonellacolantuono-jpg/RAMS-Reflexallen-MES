'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Node } from '@xyflow/react'
import {
  validateWorkflowStructure,
  type AvailableRefs,
  type ValidationError,
  type WorkflowStructure,
} from '@mes/domain'
import { sdk } from '../../lib/sdk'
import { useWorkflowStore } from './store'

function buildValidationStructure(nodes: Node[]): WorkflowStructure {
  const phaseNodes = nodes.filter((n) => n.type === 'phaseNode')
  return {
    phases: phaseNodes.map((phase) => ({
      id: phase.id,
      groups: nodes
        .filter((n) => n.type === 'groupNode' && n.data['parentId'] === phase.id)
        .map((group) => ({
          id: group.id,
          phaseId: phase.id,
          steps: nodes
            .filter((n) => n.type === 'stepNode' && n.data['parentId'] === group.id)
            .map((step) => {
              const skillId = (step.data['skillId'] as string | undefined) || null
              const deviceId = (step.data['deviceId'] as string | undefined) || null
              const recipeId = (step.data['recipeId'] as string | undefined) || null
              const toolId = (step.data['toolId'] as string | undefined) || null
              return {
                id: step.id,
                groupId: group.id,
                skillId: skillId || null,
                deviceId: deviceId || null,
                recipeId: recipeId || null,
                toolId: toolId || null,
              }
            }),
        })),
    })),
  }
}

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
  const nodes = useWorkflowStore((s) => s.nodes)
  const selectNode = useWorkflowStore((s) => s.selectNode)

  const { data: skillsResp } = useQuery({
    queryKey: ['skills', 'all'],
    queryFn: () => sdk.skills.list({ limit: 200 }),
  })
  const { data: equipmentResp } = useQuery({
    queryKey: ['equipment', 'all'],
    queryFn: () => sdk.equipment.list({ limit: 200 }),
  })
  const { data: recipesResp } = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: () => sdk.recipes.list({ limit: 200 }),
  })
  const { data: toolsResp } = useQuery({
    queryKey: ['tools', 'all'],
    queryFn: () => sdk.tools.list({ limit: 200 }),
  })

  const result = useMemo(() => {
    const structure = buildValidationStructure(nodes)
    const refs: AvailableRefs = {
      skillIds: new Set((skillsResp?.data ?? []).map((s) => s.id)),
      deviceIds: new Set((equipmentResp?.data ?? []).map((d) => d.id)),
      recipeIds: new Set((recipesResp?.data ?? []).map((r) => r.id)),
      toolIds: new Set((toolsResp?.data ?? []).map((t) => t.id)),
    }
    return validateWorkflowStructure(structure, refs)
  }, [nodes, skillsResp, equipmentResp, recipesResp, toolsResp])

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
