'use client'

import {
  ScanLine,
  Cog,
  ClipboardCheck,
  Truck,
  Wrench,
  Shield,
  FileText,
  Hand,
  Cpu,
  HelpCircle,
  Pause,
  GitBranch,
  type LucideIcon,
} from 'lucide-react'
import { useWorkflowStore } from './store'

const ICONS: Record<string, LucideIcon> = {
  ScanLine,
  Cog,
  ClipboardCheck,
  Truck,
  Wrench,
  Shield,
  FileText,
  Hand,
  Cpu,
  HelpCircle,
  Pause,
  GitBranch,
}

export type PaletteItemSource = 'category' | 'kind'

export interface PaletteItemProps {
  source: PaletteItemSource
  id: string
  labelIt: string
  descriptionIt: string
  iconName: string
}

export function PaletteItem({
  source,
  id,
  labelIt,
  descriptionIt,
  iconName,
}: PaletteItemProps) {
  const Icon = ICONS[iconName] ?? ScanLine
  const setDragSource = useWorkflowStore((s) => s.setDragSource)

  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(
      'application/workflow-palette',
      JSON.stringify({ source, id, labelIt }),
    )
    event.dataTransfer.effectAllowed = 'copy'
    setDragSource({ source, id })
  }

  const onDragEnd = () => {
    setDragSource(null)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-palette-source={source}
      data-palette-id={id}
      className="group flex items-start gap-2 px-2.5 py-2 rounded-md border border-neutral-200 bg-white hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-grab active:cursor-grabbing select-none shadow-sm transition-colors"
    >
      <Icon
        size={16}
        className="mt-0.5 text-neutral-500 group-hover:text-primary-600 shrink-0"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-neutral-800 group-hover:text-primary-800 truncate">
          {labelIt}
        </div>
        <div className="text-[10px] text-neutral-500 group-hover:text-primary-600 truncate">
          {descriptionIt}
        </div>
      </div>
    </div>
  )
}
