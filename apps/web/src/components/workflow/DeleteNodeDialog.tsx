'use client'

import { ConfirmModal } from '@mes/ui'
import { useWorkflowStore, type WorkflowNodeKind } from './store'

const ARTICLE: Record<WorkflowNodeKind, string> = {
  phaseNode: 'la fase',
  groupNode: 'il gruppo',
  stepNode: 'lo step',
}

const TITLE: Record<WorkflowNodeKind, string> = {
  phaseNode: 'Elimina fase',
  groupNode: 'Elimina gruppo',
  stepNode: 'Elimina step',
}

function buildDescription(
  kind: WorkflowNodeKind,
  name: string,
  groupCount: number,
  stepCount: number,
): string {
  const base = `Sei sicuro di voler eliminare ${ARTICLE[kind]} "${name}"? Questa azione non può essere annullata.`
  const parts: string[] = []
  if (groupCount > 0) parts.push(`${groupCount} ${groupCount === 1 ? 'gruppo' : 'gruppi'}`)
  if (stepCount > 0) parts.push(`${stepCount} step`)
  if (parts.length === 0) return base
  return `${base} Verranno eliminati anche ${parts.join(' e ')} contenuti.`
}

export function DeleteNodeDialog() {
  const deleteConfirm = useWorkflowStore((s) => s.deleteConfirm)
  const closeDeleteConfirm = useWorkflowStore((s) => s.closeDeleteConfirm)
  const deleteNode = useWorkflowStore((s) => s.deleteNode)
  const nodes = useWorkflowStore((s) => s.nodes)

  const { open, nodeId, kind } = deleteConfirm
  if (!open || !nodeId || !kind) {
    // ConfirmModal handles open=false internally, but we still need to short-
    // circuit so we don't compute cascade counts on stale state.
    return (
      <ConfirmModal
        open={false}
        onClose={closeDeleteConfirm}
        onConfirm={closeDeleteConfirm}
      />
    )
  }

  const target = nodes.find((n) => n.id === nodeId)
  const labelRaw = target?.data?.['label']
  const name = typeof labelRaw === 'string' && labelRaw.length > 0 ? labelRaw : 'questo nodo'

  let groupCount = 0
  let stepCount = 0
  if (kind === 'phaseNode') {
    const childGroupIds = new Set(
      nodes
        .filter((n) => n.type === 'groupNode' && n.data?.['parentId'] === nodeId)
        .map((n) => n.id),
    )
    groupCount = childGroupIds.size
    stepCount = nodes.filter((n) => {
      if (n.type !== 'stepNode') return false
      const parentId = n.data?.['parentId']
      return typeof parentId === 'string' && childGroupIds.has(parentId)
    }).length
  } else if (kind === 'groupNode') {
    stepCount = nodes.filter(
      (n) => n.type === 'stepNode' && n.data?.['parentId'] === nodeId,
    ).length
  }

  return (
    <ConfirmModal
      open={open}
      onClose={closeDeleteConfirm}
      onConfirm={() => {
        deleteNode(nodeId)
        closeDeleteConfirm()
      }}
      title={TITLE[kind]}
      description={buildDescription(kind, name, groupCount, stepCount)}
      confirmLabel="Elimina"
      cancelLabel="Annulla"
      variant="danger"
    />
  )
}
