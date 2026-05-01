'use client'

import { useWorkflowStore } from './store'

const PHASE_ITEMS = [
  { category: 'inbound', label: 'Inbound' },
  { category: 'setup', label: 'Setup' },
  { category: 'production', label: 'Produzione' },
  { category: 'quality_control', label: 'Controllo Qualità' },
  { category: 'outbound', label: 'Spedizione' },
  { category: 'teardown', label: 'Smontaggio' },
] as const

const GROUP_ITEMS = [
  { category: 'assembly', label: 'Assemblaggio' },
  { category: 'device_execution', label: 'Esecuzione Dispositivo' },
  { category: 'device_setup', label: 'Setup Dispositivo' },
  { category: 'qc', label: 'Controllo Qualità' },
  { category: 'bom_check', label: 'Verifica BOM' },
  { category: 'skills_check', label: 'Verifica Skill' },
  { category: 'tooling_check', label: 'Verifica Attrezzatura' },
  { category: 'logistics', label: 'Logistica' },
  { category: 'packaging', label: 'Imballaggio' },
] as const

const STEP_ITEMS = [
  { category: 'production', label: 'Produzione' },
  { category: 'quality_control', label: 'Controllo Qualità' },
  { category: 'identification', label: 'Scansione' },
  { category: 'logistics', label: 'Logistica' },
  { category: 'setup', label: 'Setup' },
  { category: 'teardown', label: 'Smontaggio' },
  { category: 'decision', label: 'Decisione' },
  { category: 'information', label: 'Informazione' },
  { category: 'recovery', label: 'Recupero' },
] as const

function PaletteItem({
  nodeType,
  category,
  label,
  disabled = false,
}: {
  nodeType: string
  category: string
  label: string
  disabled?: boolean
}) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData(
      'application/workflow-node',
      JSON.stringify({ nodeType, category, label }),
    )
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      className={`px-2 py-1.5 rounded text-xs border select-none transition-colors ${
        disabled
          ? 'border-neutral-100 text-neutral-300 bg-neutral-50 cursor-not-allowed'
          : 'border-neutral-200 text-neutral-600 bg-white hover:border-primary-400 hover:text-primary-700 cursor-grab active:cursor-grabbing shadow-sm'
      }`}
    >
      {label}
    </div>
  )
}

export function WorkflowPalette() {
  const { selectedNodeType } = useWorkflowStore()

  const groupsEnabled = selectedNodeType === 'phaseNode'
  const stepsEnabled = selectedNodeType === 'groupNode'

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="px-3 py-2 hairline-b">
        <span className="uppercase-label">Fasi</span>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {PHASE_ITEMS.map((item) => (
          <PaletteItem key={item.category} nodeType="phaseNode" {...item} />
        ))}
      </div>

      <div className="px-3 py-2 hairline-b hairline-t">
        <span className="uppercase-label">Gruppi</span>
      </div>
      {!groupsEnabled ? (
        <p className="px-3 py-2 text-[10px] text-neutral-400">
          Seleziona una Fase sul canvas
        </p>
      ) : (
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {GROUP_ITEMS.map((item) => (
            <PaletteItem key={item.category} nodeType="groupNode" {...item} />
          ))}
        </div>
      )}

      <div className="px-3 py-2 hairline-b hairline-t">
        <span className="uppercase-label">Step</span>
      </div>
      {!stepsEnabled ? (
        <p className="px-3 py-2 text-[10px] text-neutral-400">
          Seleziona un Gruppo sul canvas
        </p>
      ) : (
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {STEP_ITEMS.map((item) => (
            <PaletteItem key={item.category} nodeType="stepNode" {...item} />
          ))}
        </div>
      )}
    </div>
  )
}
