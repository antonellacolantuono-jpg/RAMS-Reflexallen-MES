'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Modal,
  Field,
  Input,
  useToast,
} from '@mes/ui'
import {
  STEP_KINDS,
  STEP_CATEGORIES,
  getStepKindDescriptor,
  mapPaletteCategoryToStepCategory,
  type StepKindId,
} from '@mes/domain'
import { useWorkflowStore } from './store'
import { ResourceTabs } from './configurator/ResourceTabs'
import {
  ActionConfig,
  type ActionConfigState,
} from './configurator/ActionConfig'
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
} from '../../lib/step-validation-schemas'
import {
  buildAutofilledTitle,
  buildAutofilledDescription,
} from '../../lib/step-title-templates'
import { useFirstSelectedResourceCode } from '../../lib/use-resource-code'
import { ImageUpload } from '@mes/ui'
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

export function AddStepDialog() {
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

  // PNE_4_FOCUSED D1 — explicit Action Type selector + autofill + photo upload.
  // `actionType` is the DB-level Step.actionType string (one of the catalog ids
  // in `step-action-types.ts`). Autofill targets `name` (title) and
  // `description` from the templates in `step-title-templates.ts`. We track the
  // last-applied autofill snapshot to detect manual edits — once the operator
  // diverges from the suggestion, autofill stops touching that field.
  const [actionType, setActionType] = useState<string>('')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const lastAutofillRef = useRef<{ title: string; description: string }>({
    title: '',
    description: '',
  })

  // Resource selections (lifted into the dialog so ResourceTabs can read+write
  // and so the Save handler can persist them — single-FK fields end up in
  // node.data, multi-select arrays are session-only per TODO-040).
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [selectedAttentionPointIds, setSelectedAttentionPointIds] = useState<
    string[]
  >([])

  // Per-form Action Config state (D3 — kind/category-specific). One slice per
  // form key; the dialog forwards the relevant slice + setter into ActionConfig.
  const [actionConfig, setActionConfig] = useState<ActionConfigState>(
    defaultActionConfig,
  )

  // Reset form whenever the dialog opens with a new context.
  useEffect(() => {
    if (dialog.open) {
      setName('')
      setDescription('')
      setActionType('')
      setPhotoBase64(null)
      lastAutofillRef.current = { title: '', description: '' }
      setKindId(dialog.preselectedKind ?? 'manual')
      setSelectedMaterialIds([])
      setSelectedToolIds([])
      setSelectedDeviceIds([])
      setSelectedSkillIds([])
      setSelectedRecipeId(null)
      setSelectedAttentionPointIds([])
      setActionConfig(defaultActionConfig)
    }
  }, [dialog.open, dialog.preselectedKind])

  const firstResourceCode = useFirstSelectedResourceCode({
    deviceIds: selectedDeviceIds,
    recipeId: selectedRecipeId,
    toolIds: selectedToolIds,
    materialIds: selectedMaterialIds,
  })

  // Autofill effect: when actionType OR firstResourceCode changes, refresh the
  // title/description suggestion. Only overwrites the user's value when the
  // current value still matches the previously-applied autofill (or is empty).
  useEffect(() => {
    if (!actionType) return
    const suggestedTitle = buildAutofilledTitle(actionType, firstResourceCode)
    const suggestedDesc = buildAutofilledDescription(actionType)

    setName((prev) => {
      const untouched = prev === '' || prev === lastAutofillRef.current.title
      return untouched ? suggestedTitle : prev
    })
    setDescription((prev) => {
      const untouched =
        prev === '' || prev === lastAutofillRef.current.description
      return untouched ? suggestedDesc : prev
    })

    lastAutofillRef.current = {
      title: suggestedTitle,
      description: suggestedDesc,
    }
  }, [actionType, firstResourceCode])

  const targetGroup = useMemo(
    () => nodes.find((n) => n.id === dialog.groupId && n.type === 'groupNode'),
    [nodes, dialog.groupId],
  )

  if (!dialog.open || !dialog.groupId) return null

  const kindDescriptor = getStepKindDescriptor(kindId)

  const resolveStepCategory = (): string => {
    if (dialog.preselectedCategory) {
      const mapped = mapPaletteCategoryToStepCategory(dialog.preselectedCategory)
      if (mapped) return mapped
    }
    // Fallback when no palette category preselection (right-click flow): use a
    // sensible default based on the group category.
    const groupCategory = (targetGroup?.data['category'] as string) ?? ''
    if (groupCategory === 'qc') return 'quality_control'
    if (groupCategory === 'logistics') return 'logistics'
    if (groupCategory === 'packaging') return 'logistics'
    if (groupCategory === 'device_execution' || groupCategory === 'assembly') {
      return 'production'
    }
    return 'identification'
  }

  // Resolve the duration string from whichever Action Config form is active
  // (Manual/Guided/Parallel/SetupTeardown surface their own durationStr;
  // Automatic uses cycleTimeSec in seconds).
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

  // Resolve the per-form instructions (Manual/Guided own this).
  const resolveInstructions = (): string | null => {
    if (kindId === 'manual') return actionConfig.manual.instructions.trim() || null
    if (kindId === 'guided') return actionConfig.guided.instructions.trim() || null
    return null
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.show('Nome obbligatorio', 'warn')
      return
    }
    const category = resolveStepCategory()
    const formKey = deriveFormKey(kindId, category)

    // Validate the active form's slice via its Zod schema. This catches the
    // session-level required fields (e.g. instructions on Manual / Guided,
    // branchLabel on Decision, description on Parallel, subFlowWorkflowId on
    // Sub-flow). Multi-select arrays are not gated — they're optional.
    const formSchema = SCHEMAS_BY_FORM_KEY[formKey]
    const formValue = actionConfig[formKey]
    const result = formSchema.safeParse(formValue)
    if (!result.success) {
      toast.show('Compilare i campi obbligatori', 'warn')
      return
    }

    const newId = addStepNodeToGroup(dialog.groupId!, {
      label: name.trim(),
      category,
      kind: kindId,
      durationSec: resolveDurationSec(category),
      instructions: resolveInstructions(),
      // Single-FK ids — first selection wins (multi-select arrays for
      // skill/tool/device persist via session-only node.data per TODO-040).
      skillId: selectedSkillIds[0] ?? null,
      deviceId: selectedDeviceIds[0] ?? null,
      recipeId: selectedRecipeId,
      toolId: selectedToolIds[0] ?? null,
      // Session-only multi-select arrays.
      materialIds: selectedMaterialIds,
      attentionPointIds: selectedAttentionPointIds,
      // PNE_4_FOCUSED D1 — actionType (DB-level Step.actionType), description
      // template, and photoBase64 mock are session-only on node.data until F2
      // schema migration (TODO-040 extended).
      actionType: actionType || null,
      description: description.trim() || null,
      photoBase64: photoBase64 ?? null,
      // Session-only kind/category-specific config.
      actionConfig: actionConfig as unknown as Record<string, unknown>,
    })

    toast.show(`Step "${name.trim()}" aggiunto`, 'ok')
    closeAddStepDialog()

    // Focus the freshly-created node so the inspector pre-populates and the
    // canvas scrolls it into view.
    if (newId) {
      selectNode(newId, 'stepNode')
      scrollToNode?.(newId)
    }
  }

  return (
    <Modal
      open={dialog.open}
      onClose={closeAddStepDialog}
      fullScreen
      title="Aggiungi Step"
      description={
        targetGroup
          ? `Gruppo: ${(targetGroup.data['label'] as string) ?? targetGroup.id}`
          : undefined
      }
      actions={
        <>
          <button
            type="button"
            onClick={closeAddStepDialog}
            className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-2"
          >
            Salva Step
          </button>
        </>
      }
    >
      <div
        className="grid h-full gap-4"
        style={{ gridTemplateColumns: '260px minmax(0, 1fr) 340px' }}
        data-add-step-dialog="grid"
      >
        <aside
          data-pane="step-kind"
          className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Step Kind
          </h3>
          <div className="flex flex-col gap-1.5">
            {STEP_KINDS.map((k) => {
              const isActive = k.id === kindId
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKindId(k.id)}
                  className={
                    'flex flex-col items-start gap-0.5 rounded-md border px-2.5 py-2 text-left transition-colors ' +
                    (isActive
                      ? 'border-primary-500 bg-white text-primary-800 shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300')
                  }
                  aria-pressed={isActive}
                >
                  <span className="text-xs font-medium">{k.labelIt}</span>
                  <span className="text-[10px] text-neutral-500">{k.descriptionIt}</span>
                </button>
              )
            })}
          </div>
          {dialog.preselectedCategory && (
            <p className="mt-1 text-[10px] text-neutral-500">
              Categoria pre-selezionata:{' '}
              <strong className="text-neutral-700">
                {STEP_CATEGORIES.find((c) => c.id === dialog.preselectedCategory)?.labelIt}
              </strong>
            </p>
          )}
        </aside>

        <section
          data-pane="resources"
          className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Resource Selection
          </h3>
          <div className="min-h-0 flex-1">
            <ResourceTabs
              selectedMaterialIds={selectedMaterialIds}
              selectedToolIds={selectedToolIds}
              selectedDeviceIds={selectedDeviceIds}
              selectedSkillIds={selectedSkillIds}
              selectedRecipeId={selectedRecipeId}
              selectedAttentionPointIds={selectedAttentionPointIds}
              onToggleMaterial={(id) =>
                setSelectedMaterialIds((p) => toggleId(p, id))
              }
              onToggleTool={(id) => setSelectedToolIds((p) => toggleId(p, id))}
              onToggleDevice={(id) =>
                setSelectedDeviceIds((p) => toggleId(p, id))
              }
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
            />
          </div>
        </section>

        <aside
          data-pane="action-config"
          className="flex flex-col gap-3 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Action Configuration
          </h3>
          <Field label="Nome step" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Verifica torque iniziale"
              data-testid="step-name-input"
            />
          </Field>
          <Field label="Descrizione (mock autofill)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descrizione breve. Compilata automaticamente da Action Type."
              className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              data-testid="step-description-input"
            />
          </Field>
          <ActionConfig
            kindId={kindId}
            category={resolveStepCategory()}
            selectedDeviceIds={selectedDeviceIds}
            selectedToolIds={selectedToolIds}
            selectedRecipeId={selectedRecipeId}
            state={actionConfig}
            actionType={actionType}
            onChangeActionType={setActionType}
            onChangeManual={(v) =>
              setActionConfig((s) => ({ ...s, manual: v }))
            }
            onChangeAutomatic={(v) =>
              setActionConfig((s) => ({ ...s, automatic: v }))
            }
            onChangeGuided={(v) =>
              setActionConfig((s) => ({ ...s, guided: v }))
            }
            onChangeParallel={(v) =>
              setActionConfig((s) => ({ ...s, parallel: v }))
            }
            onChangeSubFlow={(v) =>
              setActionConfig((s) => ({ ...s, sub_flow: v }))
            }
            onChangeDecision={(v) =>
              setActionConfig((s) => ({ ...s, decision: v }))
            }
            onChangeInformation={(v) =>
              setActionConfig((s) => ({ ...s, information: v }))
            }
            onChangeSetupTeardown={(v) =>
              setActionConfig((s) => ({ ...s, setupTeardown: v }))
            }
          />
          <ImageUpload
            label="Foto allegata"
            value={photoBase64}
            onChange={setPhotoBase64}
            testId="photo-upload-field"
          />
          {kindDescriptor && (
            <p className="mt-1 text-[10px] text-neutral-500">
              Tipo selezionato:{' '}
              <strong className="text-neutral-700">{kindDescriptor.labelIt}</strong>
            </p>
          )}
        </aside>
      </div>
    </Modal>
  )
}
