'use client'

import Link from 'next/link'
import type { Item360WorkflowSummary } from '@mes/sdk'

export interface ItemWorkflowsPanelProps {
  workflows: Item360WorkflowSummary[]
}

export function ItemWorkflowsPanel({ workflows }: ItemWorkflowsPanelProps) {
  return (
    <section
      data-testid="item-workflows-panel"
      className="rounded-md border border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">Workflow</h2>
        <span className="text-xs text-neutral-500">{workflows.length} workflow</span>
      </header>

      {workflows.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-500 mb-3">
            Nessun workflow collegato a questo articolo.
          </p>
          <Link
            href="/workflows/new"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
          >
            Crea un workflow per questo articolo →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {workflows.map((wf) => (
            <li key={wf.id} className="hover:bg-neutral-50">
              <Link
                href={`/workflows/${wf.id}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-primary-700 shrink-0 w-32">
                  {wf.code}
                </span>
                <span className="text-sm text-neutral-800 flex-1 truncate">{wf.name}</span>
                <span className="text-xs text-neutral-500 shrink-0">
                  {wf.stepsCount} step
                </span>
                {wf.currentVersionNumber !== null && (
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 shrink-0">
                    v{wf.currentVersionNumber}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
