'use client'

import { useWorkflowStore } from '../store'
import { ProductionStepForm } from './ProductionStepForm'
import { QualityControlStepForm } from './QualityControlStepForm'
import { ScanStepForm } from './ScanStepForm'

const STEP_CATEGORY = {
  PRODUCTION: 'production',
  QUALITY_CONTROL: 'quality_control',
  IDENTIFICATION: 'identification',
} as const

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs p-4 text-center">
      {message}
    </div>
  )
}

export function StepConfigurator() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkflowStore((s) => s.selectedNodeType)
  const nodes = useWorkflowStore((s) => s.nodes)

  if (!selectedNodeId) {
    return <EmptyState message="Seleziona uno step per configurarlo" />
  }
  if (selectedNodeType !== 'stepNode') {
    return (
      <EmptyState message="Configuratore disponibile solo per gli step (D6). Configurazione di fasi e gruppi disponibile in 3b." />
    )
  }

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) {
    return <EmptyState message="Nodo non trovato" />
  }

  const category = node.data['category'] as string | undefined

  switch (category) {
    case STEP_CATEGORY.PRODUCTION:
      return <ProductionStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.QUALITY_CONTROL:
      return <QualityControlStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.IDENTIFICATION:
      return <ScanStepForm nodeId={node.id} data={node.data} />
    default:
      return (
        <EmptyState
          message={`Configuratore non disponibile per la categoria "${category ?? '—'}". D6 supporta production, quality_control, identification.`}
        />
      )
  }
}
