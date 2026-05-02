'use client'

import { useMemo } from 'react'
import type { Node } from '@xyflow/react'
import { useWorkflowStore } from '../store'
import {
  deriveFormKey,
  SESSION_ONLY_FORM_KEYS,
  type ManualValues,
  type AutomaticValues,
  type GuidedValues,
  type ParallelValues,
  type SubFlowValues,
  type DecisionValues,
  type InformationValues,
  type SetupTeardownValues,
} from '../../../lib/step-validation-schemas'
import { ManualForm } from './action-forms/ManualForm'
import { AutomaticForm } from './action-forms/AutomaticForm'
import { GuidedForm } from './action-forms/GuidedForm'
import {
  ParallelForm,
  type ParallelStepCandidate,
} from './action-forms/ParallelForm'
import { SubFlowForm } from './action-forms/SubFlowForm'
import {
  DecisionForm,
  type DecisionTargetCandidate,
} from './action-forms/DecisionForm'
import { InformationForm } from './action-forms/InformationForm'
import { SetupTeardownForm } from './action-forms/SetupTeardownForm'

export interface ActionConfigState {
  manual: ManualValues
  automatic: AutomaticValues
  guided: GuidedValues
  parallel: ParallelValues
  sub_flow: SubFlowValues
  decision: DecisionValues
  information: InformationValues
  setupTeardown: SetupTeardownValues
}

export interface ActionConfigProps {
  kindId: string
  category: string
  selectedDeviceIds: string[]
  selectedToolIds: string[]
  selectedRecipeId: string | null
  state: ActionConfigState
  onChangeManual: (v: ManualValues) => void
  onChangeAutomatic: (v: AutomaticValues) => void
  onChangeGuided: (v: GuidedValues) => void
  onChangeParallel: (v: ParallelValues) => void
  onChangeSubFlow: (v: SubFlowValues) => void
  onChangeDecision: (v: DecisionValues) => void
  onChangeInformation: (v: InformationValues) => void
  onChangeSetupTeardown: (v: SetupTeardownValues) => void
}

export function ActionConfig(props: ActionConfigProps) {
  const formKey = deriveFormKey(props.kindId, props.category)
  const showSessionHint = SESSION_ONLY_FORM_KEYS.has(formKey)

  // Pull store nodes once for the autocompletes that need them.
  const nodes = useWorkflowStore((s) => s.nodes)

  const stepNodes = useMemo(
    () => nodes.filter((n) => n.type === 'stepNode'),
    [nodes],
  )

  const parentCandidates: ParallelStepCandidate[] = useMemo(() => {
    // Steps whose parent group has supportsParallel = true.
    const parallelGroupIds = new Set(
      nodes
        .filter(
          (n) =>
            n.type === 'groupNode' &&
            (n.data['supportsParallel'] as boolean) === true,
        )
        .map((n) => n.id),
    )
    return stepNodes
      .filter((n) => parallelGroupIds.has(n.data['parentId'] as string))
      .map((n: Node) => ({
        id: n.id,
        label: (n.data['label'] as string) ?? n.id,
        cycleTimeSec:
          typeof n.data['cycleTimeSec'] === 'number'
            ? (n.data['cycleTimeSec'] as number)
            : typeof n.data['standardTimeSec'] === 'number'
              ? (n.data['standardTimeSec'] as number)
              : null,
        parallelStepsBufferSec:
          typeof n.data['parallelStepsBufferSec'] === 'number'
            ? (n.data['parallelStepsBufferSec'] as number)
            : null,
      }))
  }, [nodes, stepNodes])

  const targetCandidates: DecisionTargetCandidate[] = useMemo(
    () =>
      stepNodes.map((n) => ({
        id: n.id,
        label: (n.data['label'] as string) ?? n.id,
      })),
    [stepNodes],
  )

  return (
    <div
      className="flex flex-col gap-3"
      data-action-config-form-key={formKey}
    >
      {showSessionHint && (
        <div
          className="rounded-md border border-info/30 bg-info/10 px-3 py-2 text-[11px] text-info-ink"
          data-action-config-session-hint
        >
          Le selezioni multiple e i parametri avanzati saranno persistiti in F2
          (PROMPT_7). Per il demo, configurali per sessione.
        </div>
      )}

      {formKey === 'manual' && (
        <ManualForm value={props.state.manual} onChange={props.onChangeManual} />
      )}
      {formKey === 'automatic' && (
        <AutomaticForm
          value={props.state.automatic}
          onChange={props.onChangeAutomatic}
          selectedDeviceIds={props.selectedDeviceIds}
          selectedRecipeId={props.selectedRecipeId}
        />
      )}
      {formKey === 'guided' && (
        <GuidedForm
          value={props.state.guided}
          onChange={props.onChangeGuided}
          selectedToolIds={props.selectedToolIds}
        />
      )}
      {formKey === 'parallel' && (
        <ParallelForm
          value={props.state.parallel}
          onChange={props.onChangeParallel}
          parentCandidates={parentCandidates}
        />
      )}
      {formKey === 'sub_flow' && (
        <SubFlowForm
          value={props.state.sub_flow}
          onChange={props.onChangeSubFlow}
        />
      )}
      {formKey === 'decision' && (
        <DecisionForm
          value={props.state.decision}
          onChange={props.onChangeDecision}
          targetCandidates={targetCandidates}
        />
      )}
      {formKey === 'information' && (
        <InformationForm
          value={props.state.information}
          onChange={props.onChangeInformation}
        />
      )}
      {formKey === 'setupTeardown' && (
        <SetupTeardownForm
          value={props.state.setupTeardown}
          onChange={props.onChangeSetupTeardown}
          category={props.category}
        />
      )}
    </div>
  )
}
