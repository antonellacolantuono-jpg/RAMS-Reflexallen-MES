'use client'

import { useMemo, useState } from 'react'
import { Tabs, type Tab } from '@mes/ui'
import { MaterialsTab } from './MaterialsTab'
import { ToolsTab } from './ToolsTab'
import { DevicesTab } from './DevicesTab'
import { SkillsTab } from './SkillsTab'
import { RecipesTab } from './RecipesTab'
import { AttentionPointsTab } from './AttentionPointsTab'

export type ResourceTabId =
  | 'materials'
  | 'tools'
  | 'devices'
  | 'skills'
  | 'recipes'
  | 'attention-points'

export interface ResourceTabsProps {
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
}

const TAB_LABELS: Record<ResourceTabId, string> = {
  materials: 'Materiali',
  tools: 'Attrezzi',
  devices: 'Dispositivi',
  skills: 'Skill',
  recipes: 'Ricette',
  'attention-points': 'Attention Points',
}

const TAB_ORDER: ResourceTabId[] = [
  'materials',
  'tools',
  'devices',
  'skills',
  'recipes',
  'attention-points',
]

export function ResourceTabs(props: ResourceTabsProps) {
  const [active, setActive] = useState<ResourceTabId>('materials')

  const counts: Record<ResourceTabId, number> = useMemo(
    () => ({
      materials: props.selectedMaterialIds.length,
      tools: props.selectedToolIds.length,
      devices: props.selectedDeviceIds.length,
      skills: props.selectedSkillIds.length,
      recipes: props.selectedRecipeId ? 1 : 0,
      'attention-points': props.selectedAttentionPointIds.length,
    }),
    [
      props.selectedMaterialIds.length,
      props.selectedToolIds.length,
      props.selectedDeviceIds.length,
      props.selectedSkillIds.length,
      props.selectedRecipeId,
      props.selectedAttentionPointIds.length,
    ],
  )

  const tabs: Tab[] = TAB_ORDER.map((id) => {
    const count = counts[id]
    return {
      id,
      label: TAB_LABELS[id],
      ...(count > 0
        ? { count, dot: 'ok' as const }
        : {}),
    }
  })

  return (
    <div className="flex h-full flex-col gap-3" data-resource-tabs="root">
      <Tabs tabs={tabs} value={active} onChange={(id) => setActive(id as ResourceTabId)} />
      <div className="flex-1 min-h-0" data-resource-tabs-content={active}>
        {active === 'materials' && (
          <MaterialsTab
            selectedIds={props.selectedMaterialIds}
            onToggle={props.onToggleMaterial}
            onClear={props.onClearMaterials}
          />
        )}
        {active === 'tools' && (
          <ToolsTab
            selectedIds={props.selectedToolIds}
            onToggle={props.onToggleTool}
            onClear={props.onClearTools}
          />
        )}
        {active === 'devices' && (
          <DevicesTab
            selectedIds={props.selectedDeviceIds}
            onToggle={props.onToggleDevice}
            onClear={props.onClearDevices}
          />
        )}
        {active === 'skills' && (
          <SkillsTab
            selectedIds={props.selectedSkillIds}
            onToggle={props.onToggleSkill}
            onClear={props.onClearSkills}
          />
        )}
        {active === 'recipes' && (
          <RecipesTab
            selectedDeviceIds={props.selectedDeviceIds}
            selectedRecipeId={props.selectedRecipeId}
            onSelect={props.onSelectRecipe}
          />
        )}
        {active === 'attention-points' && (
          <AttentionPointsTab
            selectedIds={props.selectedAttentionPointIds}
            onToggle={props.onToggleAttentionPoint}
            onClear={props.onClearAttentionPoints}
          />
        )}
      </div>
    </div>
  )
}
