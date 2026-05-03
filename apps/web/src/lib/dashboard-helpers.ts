import type { DotTone } from '@mes/ui'

type EqBucket = { label: string; statuses: readonly string[]; tone: DotTone }

const EQUIPMENT_BUCKETS: readonly EqBucket[] = [
  { label: 'Disponibili',  statuses: ['available', 'reserved'],     tone: 'ok' },
  { label: 'In uso',       statuses: ['in_use'],                    tone: 'warn' },
  { label: 'Manutenzione', statuses: ['maintenance', 'cleaning'],   tone: 'warn' },
  { label: 'Guasti',       statuses: ['broken'],                    tone: 'bad' },
  { label: 'Offline',      statuses: ['offline', 'decommissioned'], tone: 'neutral' },
]

export function deriveEquipmentCounts(rows: ReadonlyArray<{ status: string }>) {
  return EQUIPMENT_BUCKETS.map((bucket) => ({
    ...bucket,
    count: rows.filter((r) => bucket.statuses.includes(r.status)).length,
  }))
}

type BoxBucket = {
  label: string
  statuses: readonly string[] | 'cyclesAvg'
  tone: DotTone
  isText?: boolean
}

const BOX_BUCKETS: readonly BoxBucket[] = [
  { label: 'Vuoti',                 statuses: ['empty'],                            tone: 'neutral' },
  { label: 'Parzialmente riempiti', statuses: ['filling'],                          tone: 'info' },
  { label: 'Pieni',                 statuses: ['full'],                             tone: 'info' },
  { label: 'Sigillati',             statuses: ['sealed', 'shipped', 'returned'],    tone: 'accent' },
  { label: 'Cicli rotazione ⌀',     statuses: 'cyclesAvg',                          tone: 'ok',     isText: true },
  { label: 'Danneggiati',           statuses: ['damaged'],                          tone: 'bad' },
]

export function deriveBoxCounts(rows: ReadonlyArray<{ status: string; cyclesCount: number }>) {
  return BOX_BUCKETS.map((bucket) => {
    if (bucket.statuses === 'cyclesAvg') {
      const returnable = rows.filter((r) => r.cyclesCount > 0)
      const avg = returnable.length === 0
        ? '—'
        : Math.round(returnable.reduce((acc, r) => acc + r.cyclesCount, 0) / returnable.length).toString()
      return { ...bucket, count: avg }
    }
    return {
      ...bucket,
      count: rows.filter((r) => (bucket.statuses as readonly string[]).includes(r.status)).length,
    }
  })
}
