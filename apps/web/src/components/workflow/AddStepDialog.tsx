'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Field,
  Input,
  Select,
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

function toggleId(prev: string[], id: string): string[] {
  return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
}

export function AddStepDialog() {
  const dialog = useWorkflowStore((s) => s.addStepDialog)
  const closeAddStepDialog = useWorkflowStore((s) => s.closeAddStepDialog)
  const addStepNodeToGroup = useWorkflowStore((s) => s.addStepNodeToGroup)
  const nodes = useWorkflowStore((s) => s.nodes)
  const toast = useToast()

  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [durationStr, setDurationStr] = useState('')
  const [kindId, setKindId] = useState<StepKindId>('manual')

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

  // Reset form whenever the dialog opens with a new context.
  useEffect(() => {
    if (dialog.open) {
      setName('')
      setInstructions('')
      setDurationStr('')
      setKindId(dialog.preselectedKind ?? 'manual')
      setSelectedMaterialIds([])
      setSelectedToolIds([])
      setSelectedDeviceIds([])
      setSelectedSkillIds([])
      setSelectedRecipeId(null)
      setSelectedAttentionPointIds([])
    }
  }, [dialog.open, dialog.preselectedKind])

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

  const handleSave = () => {
    if (!name.trim()) {
      toast.show('Nome obbligatorio', 'warn')
      return
    }
    const category = resolveStepCategory()
    const durationSec = durationStr ? Number(durationStr) : null
    addStepNodeToGroup(dialog.groupId!, {
      label: name.trim(),
      category,
      kind: kindId,
      durationSec: durationSec && !Number.isNaN(durationSec) ? durationSec : null,
      instructions: instructions.trim() || null,
    })
    toast.show(`Step "${name.trim()}" aggiunto`, 'ok')
    closeAddStepDialog()
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
          className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Action Configuration
          </h3>
          <Field label="Nome step" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Verifica torque iniziale"
            />
          </Field>
          {(kindId === 'manual' || kindId === 'guided') && (
            <Field label="Istruzioni operatore">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="Indicare istruzioni passo-passo"
                className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </Field>
          )}
          {(kindId === 'manual' || kindId === 'guided' || kindId === 'parallel') && (
            <Field label="Durata standard (sec)">
              <Input
                type="number"
                min={0}
                value={durationStr}
                onChange={(e) => setDurationStr(e.target.value)}
                placeholder="es. 45"
              />
            </Field>
          )}
          {kindId === 'automatic' && (
            <Field
              label="Dispositivo + ricetta"
              hint="Configurazione completa nel PROMPT_PNE_1"
            >
              <Select disabled value="">
                <option value="">— da configurare in PNE_1 —</option>
              </Select>
            </Field>
          )}
          {kindId === 'sub_flow' && (
            <Field
              label="Sotto-flusso collegato"
              hint="Selezione completa nel PROMPT_PNE_1"
            >
              <Select disabled value="">
                <option value="">— da configurare in PNE_1 —</option>
              </Select>
            </Field>
          )}
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
