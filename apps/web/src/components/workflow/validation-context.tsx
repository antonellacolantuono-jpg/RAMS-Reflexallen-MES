'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useWorkflowValidation, type WorkflowValidation } from './useWorkflowValidation'

const ValidationContext = createContext<WorkflowValidation | null>(null)

export function WorkflowValidationProvider({ children }: { children: ReactNode }) {
  const value = useWorkflowValidation()
  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>
}

/**
 * Reads the validation result from context. Returns `null` when no provider
 * is mounted upstream — this keeps node components safe to render outside
 * the workflow designer (e.g. previews, storybook).
 */
export function useValidationContext(): WorkflowValidation | null {
  return useContext(ValidationContext)
}

/**
 * Convenience hook for canvas node components: returns the per-node messages
 * (or an empty array) so each node can render a badge with a tooltip.
 */
export function useNodeBadge(nodeId: string): string[] {
  const ctx = useContext(ValidationContext)
  if (!ctx) return []
  return ctx.errorsByNodeId.get(nodeId) ?? []
}
