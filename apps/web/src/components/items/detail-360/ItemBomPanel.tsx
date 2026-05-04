'use client'

import Link from 'next/link'
import type { Item360BomLine } from '@mes/sdk'

export interface ItemBomPanelProps {
  bom: Item360BomLine[]
}

export function ItemBomPanel({ bom }: ItemBomPanelProps) {
  return (
    <section
      data-testid="item-bom-panel"
      className="rounded-md border border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">Distinta base (BOM)</h2>
        <span className="text-xs text-neutral-500">{bom.length} componenti</span>
      </header>

      {bom.length === 0 ? (
        <div className="p-6 text-sm text-neutral-500 text-center">
          Nessun componente nella distinta base.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {bom.map((line) => (
            <li
              key={line.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
            >
              <Link
                href={`/items/${line.componentId}`}
                className="text-sm font-medium text-primary-700 hover:underline shrink-0 w-32"
              >
                {line.componentCode}
              </Link>
              <span className="text-sm text-neutral-800 flex-1 truncate">
                {line.componentName}
              </span>
              <span className="text-sm text-neutral-600 shrink-0 tabular-nums">
                {line.qty} {line.uom}
              </span>
              {line.isOptional && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  opzionale
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
