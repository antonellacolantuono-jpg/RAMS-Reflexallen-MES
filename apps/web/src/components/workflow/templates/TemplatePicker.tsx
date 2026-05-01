'use client'

import { useQuery } from '@tanstack/react-query'
import { sdk } from '../../../lib/sdk'
import type { WorkflowModel } from '@mes/sdk'

export interface TemplatePickerProps {
  selectedId: string | null
  onSelect: (template: WorkflowModel) => void
}

const TEMPLATE_PREFIX = 'TPL_'

export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['workflows', 'templates'],
    queryFn: () => sdk.workflows.list({ page: 1, limit: 50, search: TEMPLATE_PREFIX }),
  })

  const templates = (data?.data ?? []).filter((w) => w.code.startsWith(TEMPLATE_PREFIX))

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Caricamento template…</p>
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        Nessun template disponibile. Esegui il seed per popolare i template di partenza.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {templates.map((tpl) => {
        const selected = tpl.id === selectedId
        return (
          <button
            type="button"
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className={`text-left rounded-md border p-4 transition-colors ${
              selected
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-neutral-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="font-medium text-sm text-neutral-900 mb-1">{tpl.name}</div>
            <div className="font-mono text-xs text-neutral-500 mb-2">{tpl.code}</div>
            {tpl.description && (
              <div className="text-xs text-neutral-600 line-clamp-3">{tpl.description}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}
