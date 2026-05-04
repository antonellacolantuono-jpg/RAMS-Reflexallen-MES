'use client'

// PROMPT_15 B.2 — StepConfiguratorPane
//
// Universal 4-pane step editor that replaces AddStepDialog at the page-level
// mount. Hybrid scope per user decision #5: Configuration Center has 3 tabs:
//   - Main      : title + description + duration + blocking + image
//   - Pre/Post  : time mode + part reference + no-target policy (device only)
//   - Avanzate  : recoveryConfig + parallel buffer + attention points + materials + verification checklist
//
// Wizard steps (Categoria → Azione → Risorsa → Dove → Riepilogo) drive which
// Configuration Center tab is foregrounded; clicking through is informational
// and does not gate save. Save uses the same `addStepNodeToGroup` store action
// — adds workUnitId to the payload (PROMPT_15 C.2).

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Modal,
  Field,
  Input,
  Tabs,
  ImageUpload,
  FourPaneConfigurator,
  type FourPaneWizardStep,
  useToast,
} from '@mes/ui'
import {
  STEP_KINDS,
  STEP_CATEGORIES,
  getStepKindDescriptor,
  mapPaletteCategoryToStepCategory,
  type StepKindId,
} from '@mes/domain'
import { useQuery } from '@tanstack/react-query'
import { sdk } from '../../../lib/sdk'
import { useWorkflowStore } from '../store'
import { ResourceTabs } from './ResourceTabs'
import { ActionConfig, type ActionConfigState } from './ActionConfig'
import {
  defaultManual,
  defaultAutomatic,
  defaultGuided,
  defaultParallel,
  defaultSubFlow,
  defaultDecision,
  defaultInformation,
  defaultSetupTeardown,
  deriveFormKey,
  ManualSchema,
  AutomaticSchema,
  GuidedSchema,
  ParallelSchema,
  SubFlowSchema,
  DecisionSchema,
  InformationSchema,
  SetupTeardownSchema,
  type FormKey,
} from '../../../lib/step-validation-schemas'
import {
  buildAutofilledTitle,
  buildAutofilledDescription,
} from '../../../lib/step-title-templates'
import { useFirstSelectedResourceCode } from '../../../lib/use-resource-code'
import { ACTION_TYPES_BY_CATEGORY, type StepCategory } from '../../../lib/step-action-types'
import type { ZodTypeAny } from 'zod'

function toggleId(prev: string[], id: string): string[] {
  return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
}

const defaultActionConfig: ActionConfigState = {
  manual: defaultManual,
  automatic: defaultAutomatic,
  guided: defaultGuided,
  parallel: defaultParallel,
  sub_flow: defaultSubFlow,
  decision: defaultDecision,
  information: defaultInformation,
  setupTeardown: defaultSetupTeardown,
}

const SCHEMAS_BY_FORM_KEY: Record<FormKey, ZodTypeAny> = {
  manual: ManualSchema,
  automatic: AutomaticSchema,
  guided: GuidedSchema,
  parallel: ParallelSchema,
  sub_flow: SubFlowSchema,
  decision: DecisionSchema,
  information: InformationSchema,
  setupTeardown: SetupTeardownSchema,
}

type WizardStepId = 'categoria' | 'azione' | 'risorsa' | 'dove' | 'riepilogo'
type ConfigTabId = 'main' | 'prePost' | 'avanzate'

export function StepConfiguratorPane() {
  const dialog = useWorkflowStore((s) => s.addStepDialog)
  const closeAddStepDialog = useWorkflowStore((s) => s.closeAddStepDialog)
  const addStepNodeToGroup = useWorkflowStore((s) => s.addStepNodeToGroup)
  const selectNode = useWorkflowStore((s) => s.selectNode)
  const scrollToNode = useWorkflowStore((s) => s.scrollToNode)
  const nodes = useWorkflowStore((s) => s.nodes)
  const toast = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kindId, setKindId] = useState<StepKindId>('manual')
  const [actionType, setActionType] = useState<string>('')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [workUnitId, setWorkUnitId] = useState<string | null>(null)
  const lastAutofillRef = useRef<{ title: string; description: string }>({
    title: '',
    description: '',
  })

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [selectedAttentionPointIds, setSelectedAttentionPointIds] = useState<string[]>([])
  const [actionConfig, setActionConfig] = useState<ActionConfigState>(defaultActionConfig)

  const [wizardStep, setWizardStep] = useState<WizardStepId>('categoria')
  const [configTab, setConfigTab] = useState<ConfigTabId>('main')

  // Reset on open
  useEffect(() => {
    if (dialog.open) {
      setName('')
      setDescription('')
      setActionType('')
      setPhotoBase64(null)
      setWorkUnitId(null)
      lastAutofillRef.current = { title: '', description: '' }
      setKindId(dialog.preselectedKind ?? 'manual')
      setSelectedMaterialIds([])
      setSelectedToolIds([])
      setSelectedDeviceIds([])
      setSelectedSkillIds([])
      setSelectedRecipeId(null)
      setSelectedAttentionPointIds([])
      setActionConfig(defaultActionConfig)
      setWizardStep('categoria')
      setConfigTab('main')
    }
  }, [dialog.open, dialog.preselectedKind])

  const firstResourceCode = useFirstSelectedResourceCode({
    deviceIds: selectedDeviceIds,
    recipeId: selectedRecipeId,
    toolIds: selectedToolIds,
    materialIds: selectedMaterialIds,
  })

  // Autofill name + description when actionType changes
  useEffect(() => {
    if (!actionType) return
    const suggestedTitle = buildAutofilledTitle(actionType, firstResourceCode)
    const suggestedDesc = buildAutofilledDescription(actionType)
    setName((prev) => {
      const untouched = prev === '' || prev === lastAutofillRef.current.title
      return untouched ? suggestedTitle : prev
    })
    setDescription((prev) => {
      const untouched = prev === '' || prev === lastAutofillRef.current.description
      return untouched ? suggestedDesc : prev
    })
    lastAutofillRef.current = { title: suggestedTitle, description: suggestedDesc }
  }, [actionType, firstResourceCode])

  const targetGroup = useMemo(
    () => nodes.find((n) => n.id === dialog.groupId && n.type === 'groupNode'),
    [nodes, dialog.groupId],
  )

  const resolveStepCategory = (): string => {
    if (dialog.preselectedCategory) {
      const mapped = mapPaletteCategoryToStepCategory(dialog.preselectedCategory)
      if (mapped) return mapped
    }
    const groupCategory = (targetGroup?.data['category'] as string) ?? ''
    if (groupCategory === 'qc') return 'quality_control'
    if (groupCategory === 'logistics') return 'logistics'
    if (groupCategory === 'packaging') return 'logistics'
    if (groupCategory === 'device_execution' || groupCategory === 'assembly') return 'production'
    return 'identification'
  }

  const stepCategory = resolveStepCategory()
  const isDeviceFlow = stepCategory === 'production'

  // Fetch all plant Work Units for the "Dove" wizard step (decision #3 — all
  // plant WUs, no WC filter). Keys on the target group's plant context if
  // available, falling back to the user's current plant via SDK default.
  const { data: equipmentTree } = useQuery({
    queryKey: ['equipment', 'tree'],
    queryFn: () => sdk.equipment.tree(),
    enabled: dialog.open,
  })
  const allWorkUnits = useMemo(() => {
    if (!equipmentTree) return [] as Array<{ id: string; code: string; name: string }>
    const out: Array<{ id: string; code: string; name: string }> = []
    function walk(nodes: Array<{ id: string; code: string; name: string; level: string; children?: typeof nodes }>) {
      for (const n of nodes) {
        if (n.level === 'work_unit') {
          out.push({ id: n.id, code: n.code, name: n.name })
        }
        if (n.children) walk(n.children)
      }
    }
    walk(equipmentTree as unknown as Parameters<typeof walk>[0])
    return out
  }, [equipmentTree])

  if (!dialog.open || !dialog.groupId) return null

  const kindDescriptor = getStepKindDescriptor(kindId)

  const resolveDurationSec = (category: string): number | null => {
    const formKey =
      category === 'decision'
        ? 'decision'
        : category === 'information'
          ? 'information'
          : category === 'setup' || category === 'teardown'
            ? 'setupTeardown'
            : kindId
    const raw =
      formKey === 'manual'
        ? actionConfig.manual.durationStr
        : formKey === 'automatic'
          ? actionConfig.automatic.cycleTimeSec
          : formKey === 'guided'
            ? actionConfig.guided.durationStr
            : formKey === 'parallel'
              ? actionConfig.parallel.durationDuringDeviceCycleSec
              : formKey === 'setupTeardown'
                ? actionConfig.setupTeardown.durationStr
                : ''
    if (raw === '' || raw == null) return null
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const resolveInstructions = (): string | null => {
    if (kindId === 'manual') return actionConfig.manual.instructions.trim() || null
    if (kindId === 'guided') return actionConfig.guided.instructions.trim() || null
    return null
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.show('Nome obbligatorio', 'warn')
      setWizardStep('riepilogo')
      setConfigTab('main')
      return
    }
    const formKey = deriveFormKey(kindId, stepCategory)
    const formSchema = SCHEMAS_BY_FORM_KEY[formKey]
    const formValue = actionConfig[formKey]
    const result = formSchema.safeParse(formValue)
    if (!result.success) {
      toast.show('Compilare i campi obbligatori', 'warn')
      setConfigTab('avanzate')
      return
    }
    const newId = addStepNodeToGroup(dialog.groupId!, {
      label: name.trim(),
      category: stepCategory,
      kind: kindId,
      durationSec: resolveDurationSec(stepCategory),
      instructions: resolveInstructions(),
      skillId: selectedSkillIds[0] ?? null,
      deviceId: selectedDeviceIds[0] ?? null,
      recipeId: selectedRecipeId,
      toolId: selectedToolIds[0] ?? null,
      workUnitId,
      materialIds: selectedMaterialIds,
      attentionPointIds: selectedAttentionPointIds,
      actionType: actionType || null,
      description: description.trim() || null,
      photoBase64: photoBase64 ?? null,
      actionConfig: actionConfig as unknown as Record<string, unknown>,
    })
    toast.show(`Step "${name.trim()}" aggiunto`, 'ok')
    closeAddStepDialog()
    if (newId) {
      selectNode(newId, 'stepNode')
      scrollToNode?.(newId)
    }
  }

  // Wizard step completion heuristics — feeds the wizard pane's checkmarks.
  const wizardSteps: FourPaneWizardStep[] = [
    { id: 'categoria', label: 'Categoria', complete: !!kindId && !!stepCategory },
    { id: 'azione', label: 'Azione', complete: !!actionType },
    { id: 'risorsa', label: 'Risorsa', complete: hasAnyResource(), optional: !isDeviceFlow },
    { id: 'dove', label: 'Dove (Postazione)', complete: !!workUnitId, optional: true },
    { id: 'riepilogo', label: 'Riepilogo', complete: !!name.trim() },
  ]
  function hasAnyResource() {
    return (
      selectedDeviceIds.length > 0 ||
      selectedToolIds.length > 0 ||
      selectedSkillIds.length > 0 ||
      selectedMaterialIds.length > 0 ||
      selectedRecipeId !== null
    )
  }

  // Palette adapter — contextual per category. We render a pass-through label;
  // the user clicks through to ResourceTabs in the Configuration Center for
  // multi-select. The palette here is informational/quick-pick.
  const paletteAdapter = buildPaletteAdapter({
    category: stepCategory,
    kindId,
    onSelectAdvanced: () => setConfigTab('avanzate'),
  })

  const subtitle = targetGroup
    ? `Gruppo: ${(targetGroup.data['label'] as string) ?? targetGroup.id}`
    : undefined

  return (
    <Modal
      open={dialog.open}
      onClose={closeAddStepDialog}
      fullScreen
      title="Configura Step"
      description={subtitle}
      className="!p-0"
    >
      <div data-testid="step-configurator-pane" className="h-[calc(90vh-4rem)] xl:h-full flex">
        <FourPaneConfigurator
          title="Nuovo Step"
          subtitle={subtitle}
          wizardSteps={wizardSteps}
          currentWizardStep={wizardStep}
          onWizardStepChange={(id) => {
            setWizardStep(id as WizardStepId)
            // Map wizard step → suggested config tab focus
            if (id === 'categoria' || id === 'azione' || id === 'riepilogo') setConfigTab('main')
            if (id === 'dove') setConfigTab('main')
            if (id === 'risorsa') setConfigTab('avanzate')
          }}
          paletteAdapter={paletteAdapter}
          configCenter={{
            title: 'Configurazione',
            children: (
              <ConfiguratorBody
                wizardStep={wizardStep}
                configTab={configTab}
                onConfigTabChange={setConfigTab}
                isDeviceFlow={isDeviceFlow}
                stepCategory={stepCategory}
                kindId={kindId}
                onChangeKind={setKindId}
                actionType={actionType}
                onChangeActionType={setActionType}
                name={name}
                onChangeName={setName}
                description={description}
                onChangeDescription={setDescription}
                photoBase64={photoBase64}
                onChangePhoto={setPhotoBase64}
                workUnitId={workUnitId}
                onChangeWorkUnit={setWorkUnitId}
                allWorkUnits={allWorkUnits}
                selectedMaterialIds={selectedMaterialIds}
                selectedToolIds={selectedToolIds}
                selectedDeviceIds={selectedDeviceIds}
                selectedSkillIds={selectedSkillIds}
                selectedRecipeId={selectedRecipeId}
                selectedAttentionPointIds={selectedAttentionPointIds}
                onToggleMaterial={(id) => setSelectedMaterialIds((p) => toggleId(p, id))}
                onToggleTool={(id) => setSelectedToolIds((p) => toggleId(p, id))}
                onToggleDevice={(id) => setSelectedDeviceIds((p) => toggleId(p, id))}
                onToggleSkill={(id) => setSelectedSkillIds((p) => toggleId(p, id))}
                onToggleAttentionPoint={(id) =>
                  setSelectedAttentionPointIds((p) => toggleId(p, id))
                }
                onSelectRecipe={(id) => setSelectedRecipeId(id)}
                onClearMaterials={() => setSelectedMaterialIds([])}
                onClearTools={() => setSelectedToolIds([])}
                onClearDevices={() => setSelectedDeviceIds([])}
                onClearSkills={() => setSelectedSkillIds([])}
                onClearAttentionPoints={() => setSelectedAttentionPointIds([])}
                actionConfig={actionConfig}
                onChangeActionConfig={setActionConfig}
                kindDescriptorLabel={kindDescriptor?.labelIt ?? null}
              />
            ),
          }}
          livePreview={{
            title: 'Anteprima',
            children: (
              <StepPreview
                name={name}
                description={description}
                actionType={actionType}
                stepCategory={stepCategory}
                workUnitCode={
                  allWorkUnits.find((w) => w.id === workUnitId)?.code ?? null
                }
                durationSec={resolveDurationSec(stepCategory)}
              />
            ),
          }}
          onCancel={closeAddStepDialog}
          onSave={handleSave}
          saveDisabled={!name.trim()}
        />
      </div>
    </Modal>
  )
}

function buildPaletteAdapter({
  category,
  kindId,
  onSelectAdvanced,
}: {
  category: string
  kindId: StepKindId
  onSelectAdvanced: () => void
}) {
  const stepKind = STEP_KINDS.find((k) => k.id === kindId)
  const items: Array<{ id: string; label: string; description: string }> = []
  if (category === 'production') {
    items.push(
      { id: 'devices', label: 'Dispositivi', description: 'Apri lista dispositivi disponibili' },
      { id: 'tools', label: 'Utensili', description: 'Apri lista utensili compatibili' },
      { id: 'recipes', label: 'Ricette', description: 'Seleziona una ricetta per il dispositivo' },
    )
  } else if (category === 'quality_control') {
    items.push(
      { id: 'skills', label: 'Competenze', description: 'Seleziona la competenza richiesta' },
      { id: 'tools', label: 'Strumenti misura', description: 'Apri lista strumenti' },
    )
  } else if (category === 'logistics') {
    items.push(
      { id: 'materials', label: 'Materiali', description: 'Apri lista materiali' },
      { id: 'attention', label: 'Note attenzione', description: 'Apri lista attention points' },
    )
  } else {
    items.push({
      id: 'manual',
      label: 'Step manuale',
      description: stepKind?.descriptionIt ?? 'Nessuna risorsa richiesta',
    })
  }
  return {
    title: `Risorse — ${category}`,
    items,
    renderItem: (item: typeof items[number]) => (
      <button
        type="button"
        onClick={() => onSelectAdvanced()}
        data-testid={`palette-${item.id}`}
        className="block w-full px-3 py-2 text-left hover:bg-neutral-50 border-b border-neutral-100"
      >
        <div className="text-sm font-medium text-neutral-800">{item.label}</div>
        <div className="text-xs text-neutral-500">{item.description}</div>
      </button>
    ),
    onSelect: () => onSelectAdvanced(),
    emptyHint: 'Step manuale, nessuna risorsa richiesta.',
  }
}

interface ConfiguratorBodyProps {
  wizardStep: WizardStepId
  configTab: ConfigTabId
  onConfigTabChange: (id: ConfigTabId) => void
  isDeviceFlow: boolean
  stepCategory: string
  kindId: StepKindId
  onChangeKind: (id: StepKindId) => void
  actionType: string
  onChangeActionType: (v: string) => void
  name: string
  onChangeName: (v: string) => void
  description: string
  onChangeDescription: (v: string) => void
  photoBase64: string | null
  onChangePhoto: (v: string | null) => void
  workUnitId: string | null
  onChangeWorkUnit: (v: string | null) => void
  allWorkUnits: Array<{ id: string; code: string; name: string }>
  selectedMaterialIds: string[]
  selectedToolIds: string[]
  selectedDeviceIds: string[]
  selectedSkillIds: string[]
  selectedRecipeId: string | null
  selectedAttentionPointIds: string[]
  onToggleMaterial: (id: string) => void
  onToggleTool: (id: string) => void
  onToggleDevice: (id: string) => void
  onToggleSkill: (id: string) => void
  onToggleAttentionPoint: (id: string) => void
  onSelectRecipe: (id: string | null) => void
  onClearMaterials: () => void
  onClearTools: () => void
  onClearDevices: () => void
  onClearSkills: () => void
  onClearAttentionPoints: () => void
  actionConfig: ActionConfigState
  onChangeActionConfig: (next: ActionConfigState) => void
  kindDescriptorLabel: string | null
}

function ConfiguratorBody(props: ConfiguratorBodyProps) {
  const tabs = [
    { id: 'main', label: 'Principale' },
    ...(props.isDeviceFlow ? [{ id: 'prePost', label: 'Pre / Post' }] : []),
    { id: 'avanzate', label: 'Avanzate' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <Tabs
        tabs={tabs}
        value={props.configTab}
        onChange={(id) => props.onConfigTabChange(id as ConfigTabId)}
        className="border-b border-neutral-200"
      />
      {props.configTab === 'main' && <MainTab {...props} />}
      {props.configTab === 'prePost' && props.isDeviceFlow && <PrePostTab {...props} />}
      {props.configTab === 'avanzate' && <AvanzateTab {...props} />}
    </div>
  )
}

function MainTab(props: ConfiguratorBodyProps) {
  const validActionTypes =
    ACTION_TYPES_BY_CATEGORY[props.stepCategory as StepCategory] ?? []
  return (
    <div className="flex flex-col gap-4">
      {/* Step Kind selector */}
      <Field label="Tipo di step" required>
        <div className="flex flex-wrap gap-1.5">
          {STEP_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => props.onChangeKind(k.id)}
              data-testid={`kind-${k.id}`}
              className={
                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ' +
                (k.id === props.kindId
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300')
              }
            >
              {k.labelIt}
            </button>
          ))}
        </div>
        {props.kindDescriptorLabel && (
          <p className="mt-1 text-[11px] text-neutral-500">{props.kindDescriptorLabel}</p>
        )}
      </Field>

      <Field label="Tipo azione">
        <select
          value={props.actionType}
          onChange={(e) => props.onChangeActionType(e.target.value)}
          data-testid="action-type-select"
          className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
        >
          <option value="">— seleziona azione —</option>
          {validActionTypes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.labelIt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nome step" required>
        <Input
          value={props.name}
          onChange={(e) => props.onChangeName(e.target.value)}
          placeholder="es. Verifica torque iniziale"
          data-testid="step-name-input"
        />
      </Field>

      <Field label="Descrizione (autofill da Tipo azione)">
        <textarea
          value={props.description}
          onChange={(e) => props.onChangeDescription(e.target.value)}
          rows={2}
          placeholder="Descrizione breve."
          className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm text-neutral-800 focus:border-primary-400 focus:outline-none"
          data-testid="step-description-input"
        />
      </Field>

      <Field label="Postazione (Work Unit)">
        <select
          value={props.workUnitId ?? ''}
          onChange={(e) => props.onChangeWorkUnit(e.target.value || null)}
          data-testid="work-unit-select"
          className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
        >
          <option value="">— nessuna postazione —</option>
          {props.allWorkUnits.map((wu) => (
            <option key={wu.id} value={wu.id}>
              {wu.code} · {wu.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-neutral-500">
          Seleziona la postazione (Postazione/Work Unit) dove si esegue questo step.
        </p>
      </Field>

      <ImageUpload
        label="Foto allegata"
        value={props.photoBase64}
        onChange={props.onChangePhoto}
        testId="photo-upload-field"
      />
    </div>
  )
}

function PrePostTab(props: ConfiguratorBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-neutral-500">
        Configurazione Pre/Post per step di esecuzione dispositivo. I campi qui sotto
        determinano come lo step si lega al ciclo macchina (parallel, time mode,
        part reference, no-target policy).
      </p>
      <ActionConfig
        kindId={props.kindId}
        category={props.stepCategory}
        selectedDeviceIds={props.selectedDeviceIds}
        selectedToolIds={props.selectedToolIds}
        selectedRecipeId={props.selectedRecipeId}
        state={props.actionConfig}
        actionType={props.actionType}
        onChangeActionType={props.onChangeActionType}
        onChangeManual={(v) => props.onChangeActionConfig({ ...props.actionConfig, manual: v })}
        onChangeAutomatic={(v) =>
          props.onChangeActionConfig({ ...props.actionConfig, automatic: v })
        }
        onChangeGuided={(v) => props.onChangeActionConfig({ ...props.actionConfig, guided: v })}
        onChangeParallel={(v) => props.onChangeActionConfig({ ...props.actionConfig, parallel: v })}
        onChangeSubFlow={(v) => props.onChangeActionConfig({ ...props.actionConfig, sub_flow: v })}
        onChangeDecision={(v) => props.onChangeActionConfig({ ...props.actionConfig, decision: v })}
        onChangeInformation={(v) =>
          props.onChangeActionConfig({ ...props.actionConfig, information: v })
        }
        onChangeSetupTeardown={(v) =>
          props.onChangeActionConfig({ ...props.actionConfig, setupTeardown: v })
        }
      />
    </div>
  )
}

function AvanzateTab(props: ConfiguratorBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <ResourceTabs
        selectedMaterialIds={props.selectedMaterialIds}
        selectedToolIds={props.selectedToolIds}
        selectedDeviceIds={props.selectedDeviceIds}
        selectedSkillIds={props.selectedSkillIds}
        selectedRecipeId={props.selectedRecipeId}
        selectedAttentionPointIds={props.selectedAttentionPointIds}
        onToggleMaterial={props.onToggleMaterial}
        onToggleTool={props.onToggleTool}
        onToggleDevice={props.onToggleDevice}
        onToggleSkill={props.onToggleSkill}
        onToggleAttentionPoint={props.onToggleAttentionPoint}
        onSelectRecipe={props.onSelectRecipe}
        onClearMaterials={props.onClearMaterials}
        onClearTools={props.onClearTools}
        onClearDevices={props.onClearDevices}
        onClearSkills={props.onClearSkills}
        onClearAttentionPoints={props.onClearAttentionPoints}
      />
      <details className="rounded-md border border-neutral-200 p-3">
        <summary className="cursor-pointer text-xs font-medium text-neutral-700">
          Configurazione step avanzata (recovery, parallel buffer, instructions...)
        </summary>
        <div className="mt-3">
          <ActionConfig
            kindId={props.kindId}
            category={props.stepCategory}
            selectedDeviceIds={props.selectedDeviceIds}
            selectedToolIds={props.selectedToolIds}
            selectedRecipeId={props.selectedRecipeId}
            state={props.actionConfig}
            actionType={props.actionType}
            onChangeActionType={props.onChangeActionType}
            onChangeManual={(v) => props.onChangeActionConfig({ ...props.actionConfig, manual: v })}
            onChangeAutomatic={(v) =>
              props.onChangeActionConfig({ ...props.actionConfig, automatic: v })
            }
            onChangeGuided={(v) => props.onChangeActionConfig({ ...props.actionConfig, guided: v })}
            onChangeParallel={(v) =>
              props.onChangeActionConfig({ ...props.actionConfig, parallel: v })
            }
            onChangeSubFlow={(v) =>
              props.onChangeActionConfig({ ...props.actionConfig, sub_flow: v })
            }
            onChangeDecision={(v) =>
              props.onChangeActionConfig({ ...props.actionConfig, decision: v })
            }
            onChangeInformation={(v) =>
              props.onChangeActionConfig({ ...props.actionConfig, information: v })
            }
            onChangeSetupTeardown={(v) =>
              props.onChangeActionConfig({ ...props.actionConfig, setupTeardown: v })
            }
          />
        </div>
      </details>
    </div>
  )
}

function StepPreview({
  name,
  description,
  actionType,
  stepCategory,
  workUnitCode,
  durationSec,
}: {
  name: string
  description: string
  actionType: string
  stepCategory: string
  workUnitCode: string | null
  durationSec: number | null
}) {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
      data-testid="step-preview"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
          {stepCategory}
        </span>
        {workUnitCode && (
          <span className="rounded bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
            📍 {workUnitCode}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1" data-testid="preview-title">
        {name || 'Nome step…'}
      </h3>
      {description && (
        <p className="text-sm text-neutral-700 mb-3" data-testid="preview-description">
          {description}
        </p>
      )}
      <dl className="text-xs text-neutral-500 space-y-1">
        <div>
          <dt className="inline font-medium">Azione: </dt>
          <dd className="inline" data-testid="preview-action-type">
            {actionType || '—'}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium">Durata: </dt>
          <dd className="inline" data-testid="preview-duration">
            {durationSec ? `${durationSec}s` : '—'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
