'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Node } from '@xyflow/react'
import {
  validateWorkflowStructure,
  extractErrorNodeIds,
  groupErrorsByNodeId,
  type AvailableRefs,
  type ValidationResult,
  type WorkflowStructure,
  type ErrorNodeIds,
} from '@mes/domain'
import { sdk } from '../../lib/sdk'
import { useWorkflowStore } from './store'

export function buildValidationStructure(nodes: Node[]): WorkflowStructure {
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

export interface WorkflowValidation {
  result: ValidationResult
  errorNodeIds: ErrorNodeIds
  errorsByNodeId: Map<string, string[]>
}

/**
 * Single source of truth for workflow validation in the designer.
 * Reads nodes from the Zustand store, fetches available refs (skills, devices,
 * recipes, tools) once via TanStack Query, and exposes a memoized result plus
 * pre-computed lookup structures used by both the sidebar (ValidationPanel)
 * and inline badges on canvas nodes.
 */
export function useWorkflowValidation(): WorkflowValidation {
  const nodes = useWorkflowStore((s) => s.nodes)

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

  return useMemo(() => {
    const structure = buildValidationStructure(nodes)
    const refs: AvailableRefs = {
      skillIds: new Set((skillsResp?.data ?? []).map((s) => s.id)),
      deviceIds: new Set((equipmentResp?.data ?? []).map((d) => d.id)),
      recipeIds: new Set((recipesResp?.data ?? []).map((r) => r.id)),
      toolIds: new Set((toolsResp?.data ?? []).map((t) => t.id)),
    }
    const result = validateWorkflowStructure(structure, refs)
    return {
      result,
      errorNodeIds: extractErrorNodeIds(result),
      errorsByNodeId: groupErrorsByNodeId(result),
    }
  }, [nodes, skillsResp, equipmentResp, recipesResp, toolsResp])
}
