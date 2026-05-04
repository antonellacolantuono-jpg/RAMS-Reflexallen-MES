'use client'

import type { Item360ProductionStats } from '@mes/sdk'

export interface ItemProductionStatsCardProps {
  stats: Item360ProductionStats
}

// TODO-072 — Replace mock values with a real KPI engine query when available.
// The endpoint already returns isMock: true so this component never has to
// guess; remove the banner once stats become real.
export function ItemProductionStatsCard({ stats }: ItemProductionStatsCardProps) {
  return (
    <section
      data-testid="item-production-stats-card"
      className="rounded-md border border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">Statistiche di produzione</h2>
        {stats.isMock && (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            dati simulati
          </span>
        )}
      </header>

      <div className="grid grid-cols-3 divide-x divide-neutral-100">
        <Tile label="WO completati" value={stats.woCompleted.toString()} />
        <Tile label="Tasso scarto" value={`${(stats.scrapRate * 100).toFixed(1)}%`} />
        <Tile
          label="Tempo ciclo medio"
          value={
            stats.avgCycleTimeSec > 0
              ? `${Math.round(stats.avgCycleTimeSec)}s`
              : '—'
          }
        />
      </div>
    </section>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-xl font-semibold text-neutral-900 tabular-nums">{value}</div>
    </div>
  )
}
