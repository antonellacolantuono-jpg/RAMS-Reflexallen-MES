'use client'

import { useState } from 'react'
import type { Item360WorkLocation } from '@mes/sdk'

export interface ItemWorkLocationsPanelProps {
  workCenters: Item360WorkLocation[]
}

const STATUS_TONE: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700',
  in_use: 'bg-blue-50 text-blue-700',
  maintenance: 'bg-amber-50 text-amber-700',
  broken: 'bg-rose-50 text-rose-700',
  cleaning: 'bg-sky-50 text-sky-700',
}

export function ItemWorkLocationsPanel({ workCenters }: ItemWorkLocationsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(workCenters.map((wc) => [wc.workCenter.id, true])),
  )
  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

  return (
    <section
      data-testid="item-work-locations-panel"
      className="rounded-md border border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">Postazioni dello stabilimento</h2>
        <span className="text-xs text-neutral-500">{workCenters.length} celle</span>
      </header>

      {workCenters.length === 0 ? (
        <div className="p-6 text-sm text-neutral-500 text-center">
          Nessuna cella di lavoro configurata in questo stabilimento.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {workCenters.map((wcLoc) => {
            const wcStatus = STATUS_TONE[wcLoc.workCenter.status] ?? 'bg-neutral-100 text-neutral-700'
            const isOpen = !!expanded[wcLoc.workCenter.id]
            return (
              <li key={wcLoc.workCenter.id}>
                <button
                  type="button"
                  onClick={() => toggle(wcLoc.workCenter.id)}
                  data-testid={`wc-toggle-${wcLoc.workCenter.code}`}
                  className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-neutral-50"
                >
                  <span className="text-neutral-400 shrink-0 w-3 text-xs">
                    {isOpen ? '▾' : '▸'}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 shrink-0 w-32">
                    {wcLoc.workCenter.code}
                  </span>
                  <span className="text-sm text-neutral-700 flex-1 truncate">
                    {wcLoc.workCenter.name}
                  </span>
                  <span className="text-xs text-neutral-500 shrink-0">
                    {wcLoc.workUnits.length} postazioni
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium shrink-0 ${wcStatus}`}>
                    {wcLoc.workCenter.status}
                  </span>
                </button>

                {isOpen && wcLoc.workUnits.length > 0 && (
                  <ul className="bg-neutral-50/40 border-t border-neutral-100">
                    {wcLoc.workUnits.map((wu) => {
                      const tone = STATUS_TONE[wu.status] ?? 'bg-neutral-100 text-neutral-700'
                      return (
                        <li
                          key={wu.id}
                          className="flex items-center gap-3 px-4 py-2 pl-12 text-sm"
                          data-testid={`wu-row-${wu.code}`}
                        >
                          <span className="text-neutral-400">📍</span>
                          <span className="font-medium text-neutral-800 shrink-0 w-32">
                            {wu.code}
                          </span>
                          <span className="text-neutral-700 flex-1 truncate">{wu.name}</span>
                          <span className="text-xs text-neutral-500 shrink-0">
                            {wu.activeDevicesCount} dispositivi
                          </span>
                          <span className={`rounded px-2 py-0.5 text-[11px] font-medium shrink-0 ${tone}`}>
                            {wu.status}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
