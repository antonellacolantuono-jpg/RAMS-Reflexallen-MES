'use client'

import { useWorkflowStore } from '../store'
import { ProductionStepForm } from '../forms/ProductionStepForm'
import { QualityControlStepForm } from '../forms/QualityControlStepForm'
import { ScanStepForm } from '../forms/ScanStepForm'
import { LogisticsStepForm } from '../forms/LogisticsStepForm'
import { SetupStepForm } from '../forms/SetupStepForm'
import { RecoveryStepForm } from '../forms/RecoveryStepForm'
import { DecisionStepForm } from '../forms/DecisionStepForm'
import { InformationStepForm } from '../forms/InformationStepForm'
import { TeardownStepForm } from '../forms/TeardownStepForm'
import { PhaseConfigurator } from '../forms/PhaseConfigurator'
import { GroupConfigurator } from '../forms/GroupConfigurator'

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

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs p-4 text-center">
      {message}
    </div>
  )
}

/**
 * PropertiesTab — extracts the existing form-router from
 * forms/StepConfigurator.tsx verbatim so the 9 step forms + Phase + Group
 * configurators continue to work unchanged. PROMPT_3d D4 wraps it in a Tabs
 * container; behaviour, validation and save flow are untouched.
 */
export function PropertiesTab() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkflowStore((s) => s.selectedNodeType)
  const nodes = useWorkflowStore((s) => s.nodes)

  if (!selectedNodeId) {
    return <EmptyMessage message="Seleziona un nodo per configurarlo" />
  }

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) {
    return <EmptyMessage message="Nodo non trovato" />
  }

  if (selectedNodeType === 'phaseNode') {
    return <PhaseConfigurator nodeId={node.id} data={node.data} />
  }

  if (selectedNodeType === 'groupNode') {
    return <GroupConfigurator nodeId={node.id} data={node.data} />
  }

  if (selectedNodeType !== 'stepNode') {
    return <EmptyMessage message="Tipo di nodo non supportato" />
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
        <EmptyMessage
          message={`Configuratore non disponibile per la categoria "${category ?? '—'}".`}
        />
      )
  }
}
