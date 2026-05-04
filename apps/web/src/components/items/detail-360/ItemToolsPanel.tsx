'use client'

import Link from 'next/link'
import type { Item360ToolUsed } from '@mes/sdk'

export interface ItemToolsPanelProps {
  tools: Item360ToolUsed[]
}

const WEAR_LABEL: Record<string, { label: string; tone: string }> = {
  fresh: { label: 'Nuovo', tone: 'bg-emerald-50 text-emerald-700' },
  ok: { label: 'OK', tone: 'bg-emerald-50 text-emerald-700' },
  warn: { label: 'Attenzione', tone: 'bg-amber-50 text-amber-700' },
  warning: { label: 'Attenzione', tone: 'bg-amber-50 text-amber-700' },
  worn: { label: 'Usurato', tone: 'bg-rose-50 text-rose-700' },
  due: { label: 'Da sostituire', tone: 'bg-rose-50 text-rose-700' },
}

export function ItemToolsPanel({ tools }: ItemToolsPanelProps) {
  return (
    <section
      data-testid="item-tools-panel"
      className="rounded-md border border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">Utensili usati nei workflow</h2>
        <span className="text-xs text-neutral-500">{tools.length} utensili</span>
      </header>

      {tools.length === 0 ? (
        <div className="p-6 text-sm text-neutral-500 text-center">
          Nessun utensile referenziato dai workflow di questo articolo.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {tools.map((tool) => {
            const wear = WEAR_LABEL[tool.wearStatus] ?? {
              label: tool.wearStatus,
              tone: 'bg-neutral-100 text-neutral-700',
            }
            return (
              <li
                key={tool.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
              >
                <Link
                  href={`/tools/${tool.id}`}
                  className="text-sm font-medium text-primary-700 hover:underline shrink-0 w-32"
                >
                  {tool.code}
                </Link>
                <span className="text-sm text-neutral-800 flex-1 truncate">{tool.name}</span>
                <span className="text-xs text-neutral-500 tabular-nums shrink-0">
                  {tool.currentCyclesCount}
                  {tool.maxCycles ? ` / ${tool.maxCycles}` : ''} cicli
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-medium shrink-0 ${wear.tone}`}
                >
                  {wear.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
