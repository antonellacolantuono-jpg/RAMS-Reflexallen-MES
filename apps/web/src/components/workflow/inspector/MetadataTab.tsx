'use client'

import { useWorkflowStore } from '../store'

interface RowProps {
  label: string
  value: string | number | boolean | null | undefined
  mono?: boolean
}

function Row({ label, value, mono }: RowProps) {
  const display =
    value === undefined || value === null || value === ''
      ? '—'
      : typeof value === 'boolean'
        ? value
          ? 'Sì'
          : 'No'
        : String(value)

  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-neutral-100 last:border-b-0">
      <span className="text-[11px] uppercase tracking-wide text-neutral-500 shrink-0">
        {label}
      </span>
      <span
        className={`text-xs text-neutral-800 text-right truncate ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
        title={display}
      >
        {display}
      </span>
    </div>
  )
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs p-4 text-center">
      {message}
    </div>
  )
}

/**
 * MetadataTab — read-only metadata view per PROMPT_3d §3.5. Shows what's
 * available in the node's local data; server-side fields not loaded into the
 * editor (createdAt/By, updatedAt/By) are surfaced as "Non disponibile" and
 * will be wired when the page loads workflow audit metadata via the
 * audit-adapter (TODO-033).
 */
export function MetadataTab() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkflowStore((s) => s.selectedNodeType)
  const nodes = useWorkflowStore((s) => s.nodes)

  if (!selectedNodeId) {
    return <EmptyMessage message="Seleziona un nodo per vederne i metadati" />
  }

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) {
    return <EmptyMessage message="Nodo non trovato" />
  }

  const data = node.data
  const order = (data['order'] as number | undefined) ?? null
  const category = (data['category'] as string | undefined) ?? null
  const parentId = (data['parentId'] as string | undefined) ?? null

  if (selectedNodeType === 'phaseNode') {
    const code = order != null ? `PH-${String(order).padStart(2, '0')}` : null
    return (
      <div className="p-3 flex flex-col" data-tab-content="metadata">
        <Row label="ID" value={node.id} mono />
        <Row label="Codice" value={code} mono />
        <Row label="Categoria" value={category} />
        <Row label="Ordine" value={order} mono />
        <Row label="Cycle-based" value={(data['isCycleBased'] as boolean) ?? false} />
        <Row label="Auto-generata" value={false} />
        <Row label="Creato da" value="Non disponibile" />
        <Row label="Aggiornato da" value="Non disponibile" />
      </div>
    )
  }

  if (selectedNodeType === 'groupNode') {
    const code = order != null ? `GR-${String(order).padStart(2, '0')}` : null
    return (
      <div className="p-3 flex flex-col" data-tab-content="metadata">
        <Row label="ID" value={node.id} mono />
        <Row label="Codice" value={code} mono />
        <Row label="Categoria" value={category} />
        <Row label="Ordine" value={order} mono />
        <Row label="Fase parent" value={parentId} mono />
        <Row
          label="Supporta parallelo"
          value={(data['supportsParallel'] as boolean) ?? false}
        />
        <Row
          label="Supporta recovery"
          value={(data['supportsRecovery'] as boolean) ?? false}
        />
        <Row label="Auto-generato" value={false} />
        <Row label="Creato da" value="Non disponibile" />
        <Row label="Aggiornato da" value="Non disponibile" />
      </div>
    )
  }

  if (selectedNodeType === 'stepNode') {
    const code = order != null ? String(order).padStart(2, '0') : null
    const source = (data['source'] as string | undefined) ?? null
    return (
      <div className="p-3 flex flex-col" data-tab-content="metadata">
        <Row label="ID step" value={node.id} mono />
        <Row label="Sequenza" value={code} mono />
        <Row label="Categoria" value={category} />
        <Row label="Action type" value={data['actionType'] as string | undefined} mono />
        <Row label="Tipo" value={data['type'] as string | undefined} />
        <Row label="Gruppo parent" value={parentId} mono />
        <Row label="Auto-generato" value={source === 'auto_generated'} />
        <Row label="Required" value={(data['isRequired'] as boolean) ?? false} />
        <Row label="Creato da" value="Non disponibile" />
        <Row label="Aggiornato da" value="Non disponibile" />
      </div>
    )
  }

  return <EmptyMessage message="Tipo di nodo non supportato" />
}
