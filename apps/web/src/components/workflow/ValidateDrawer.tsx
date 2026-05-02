'use client'

import { Drawer, EmptyState } from '@mes/ui'
import { issueToNodeId } from '@mes/domain'
import { useWorkflowStore } from './store'
import { useWorkflowValidation } from './useWorkflowValidation'

export interface ValidateDrawerProps {
  open: boolean
  onClose: () => void
}

export function ValidateDrawer({ open, onClose }: ValidateDrawerProps) {
  const { result } = useWorkflowValidation()
  const scrollToNode = useWorkflowStore((s) => s.scrollToNode)
  const selectNode = useWorkflowStore((s) => s.selectNode)
  const nodes = useWorkflowStore((s) => s.nodes)

  const errors = result.ok ? [] : result.errors

  const handleClickIssue = (field: string) => {
    const issue = errors.find((e) => e.field === field)
    if (!issue) return
    const nodeId = issueToNodeId(issue)
    if (!nodeId) return
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    selectNode(nodeId, node.type ?? null)
    scrollToNode?.(nodeId)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Validazione workflow"
      subtitle={
        result.ok
          ? 'Nessun problema rilevato'
          : `${errors.length} problema${errors.length === 1 ? '' : 'i'} rilevati`
      }
      width={360}
    >
      {result.ok ? (
        <EmptyState
          kind="success"
          title="Workflow valido"
          body="Pronto per la pubblicazione"
          compact
        />
      ) : (
        <ul
          className="flex flex-col gap-1.5"
          data-validate-drawer="issues"
        >
          {errors.map((err, idx) => {
            const nodeId = issueToNodeId(err)
            const isClickable = Boolean(nodeId)
            return (
              <li
                key={`${err.field}-${idx}`}
                className={
                  'rounded-md border border-error-200 bg-error-50 p-2 text-xs text-error-800 ' +
                  (isClickable
                    ? 'cursor-pointer hover:border-error-400 hover:bg-error-100'
                    : 'opacity-80')
                }
                onClick={isClickable ? () => handleClickIssue(err.field) : undefined}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={
                  isClickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClickIssue(err.field)
                        }
                      }
                    : undefined
                }
              >
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-error-500"
                  />
                  <div className="min-w-0">
                    <div className="font-medium leading-tight">{err.message}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-error-700/70 truncate">
                      {err.field}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Drawer>
  )
}
