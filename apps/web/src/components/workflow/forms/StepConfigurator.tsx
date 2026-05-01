'use client'

import { useWorkflowStore } from '../store'
import { ProductionStepForm } from './ProductionStepForm'
import { QualityControlStepForm } from './QualityControlStepForm'
import { ScanStepForm } from './ScanStepForm'
import { LogisticsStepForm } from './LogisticsStepForm'
import { SetupStepForm } from './SetupStepForm'
import { RecoveryStepForm } from './RecoveryStepForm'
import { DecisionStepForm } from './DecisionStepForm'
import { InformationStepForm } from './InformationStepForm'
import { TeardownStepForm } from './TeardownStepForm'
import { PhaseConfigurator } from './PhaseConfigurator'
import { GroupConfigurator } from './GroupConfigurator'

const STEP_CATEGORY = {
  PRODUCTION: 'production',
  QUALITY_CONTROL: 'quality_control',
  IDENTIFICATION: 'identification',
  LOGISTICS: 'logistics',
  SETUP: 'setup',
  TEARDOWN: 'teardown',
  DECISION: 'decision',
  INFORMATION: 'information',
  RECOVERY: 'recovery',
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
    return <EmptyState message="Seleziona un nodo per configurarlo" />
  }

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) {
    return <EmptyState message="Nodo non trovato" />
  }

  if (selectedNodeType === 'phaseNode') {
    return <PhaseConfigurator nodeId={node.id} data={node.data} />
  }

  if (selectedNodeType === 'groupNode') {
    return <GroupConfigurator nodeId={node.id} data={node.data} />
  }

  if (selectedNodeType !== 'stepNode') {
    return <EmptyState message="Tipo di nodo non supportato" />
  }

  const category = node.data['category'] as string | undefined

  switch (category) {
    case STEP_CATEGORY.PRODUCTION:
      return <ProductionStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.QUALITY_CONTROL:
      return <QualityControlStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.IDENTIFICATION:
      return <ScanStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.LOGISTICS:
      return <LogisticsStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.SETUP:
      return <SetupStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.TEARDOWN:
      return <TeardownStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.DECISION:
      return <DecisionStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.INFORMATION:
      return <InformationStepForm nodeId={node.id} data={node.data} />
    case STEP_CATEGORY.RECOVERY:
      return <RecoveryStepForm nodeId={node.id} data={node.data} />
    default:
      return (
        <EmptyState
          message={`Configuratore non disponibile per la categoria "${category ?? '—'}".`}
        />
      )
  }
}
