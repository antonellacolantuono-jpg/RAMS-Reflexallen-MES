'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import {
  PageHeader,
  KPI,
  Card,
  Button,
  Badge,
  Dot,
  Progress,
  StatusBadge,
  PriorityBadge,
  type StatusValue,
  type Priority,
  type DotTone,
  type KPITone,
  type ProgressTone,
} from '@mes/ui'
import { sdk } from '../../lib/sdk'

type Kpi = { label: string; value: string; unit: string; tone?: KPITone; sub?: string }

const MOCK_KPIS: Kpi[] = [
  { label: 'OEE', value: '78.4', unit: '%', sub: 'Target 82%', tone: 'warn' },
  { label: 'Disponibilità', value: '91.2', unit: '%', tone: 'ok' },
  { label: 'Performance', value: '88.0', unit: '%', tone: 'ok' },
  { label: 'Qualità', value: '97.8', unit: '%', tone: 'ok' },
  { label: 'Throughput', value: '142', unit: 'pc/h', sub: 'vs 156 piano' },
  { label: 'Scarto', value: '2.2', unit: '%', sub: '+0.4 vs media', tone: 'warn' },
]

type ActiveWO = {
  id: string
  code: string
  itemName: string
  workCenter: string
  operator: string
  qtyProduced: number
  qtyTarget: number
  status: StatusValue
  priority: Priority
}

// TODO(PROMPT-future): replace with WorkOrdersClient.list() when SDK + endpoint built
const MOCK_ACTIVE_WOS: ActiveWO[] = [
  { id: 'wo-1', code: 'WO-2026-0142', itemName: 'Tubo PA12 ⌀8 nero',          workCenter: 'WC-PNE-A',    operator: 'Marco Conti',     qtyProduced: 168, qtyTarget: 240, status: 'in_progress', priority: 'high' },
  { id: 'wo-2', code: 'WO-2026-0143', itemName: 'Tubo PA12 ⌀10 verde',        workCenter: 'WC-PNE-B',    operator: 'Sara Rossi',      qtyProduced: 92,  qtyTarget: 200, status: 'in_progress', priority: 'normal' },
  { id: 'wo-3', code: 'WO-2026-0144', itemName: 'Bracket carbonio R7',        workCenter: 'WC-CFRP-1',   operator: 'Luca Verdi',      qtyProduced: 4,   qtyTarget: 12,  status: 'in_progress', priority: 'urgent' },
  { id: 'wo-4', code: 'WO-2026-0145', itemName: 'Pannello R104 reflective',   workCenter: 'WC-SAFETY-A', operator: 'Giulia Neri',     qtyProduced: 68,  qtyTarget: 150, status: 'in_progress', priority: 'normal' },
  { id: 'wo-5', code: 'WO-2026-0141', itemName: 'Tubo PA12 ⌀6 blu',           workCenter: 'WC-PNE-A',    operator: 'Marco Conti',     qtyProduced: 145, qtyTarget: 300, status: 'on_hold',     priority: 'high' },
  { id: 'wo-6', code: 'WO-2026-0140', itemName: 'Bracket carbonio L9',        workCenter: 'WC-CFRP-2',   operator: 'Andrea Bianchi',  qtyProduced: 6,   qtyTarget: 8,   status: 'on_hold',     priority: 'urgent' },
  { id: 'wo-7', code: 'WO-2026-0146', itemName: 'Pannello R104 amber',        workCenter: 'WC-SAFETY-B', operator: 'Elena Ferri',     qtyProduced: 24,  qtyTarget: 80,  status: 'in_progress', priority: 'low' },
  { id: 'wo-8', code: 'WO-2026-0147', itemName: 'Tubo PA12 ⌀12 nero',         workCenter: 'WC-PNE-C',    operator: 'Davide Galli',    qtyProduced: 0,   qtyTarget: 180, status: 'in_progress', priority: 'normal' },
]

const STATUS_LABEL_IT: Partial<Record<StatusValue, string>> = {
  in_progress: 'In esecuzione',
  on_hold: 'In pausa',
}

type Activity = { time: string; event: string; detail: string; tone: DotTone }

// TODO(post-demo): replace with Socket.IO event stream when implemented
const MOCK_ACTIVITY: Activity[] = [
  { time: '14:23', event: 'Step completato',   detail: 'WO-2026-0142 · Test tenuta pezzo #168',                 tone: 'ok' },
  { time: '14:22', event: 'Imballo sigillato', detail: 'BOX-PLT-001235 · 48/48 unità · SEAL-2026-00742',         tone: 'accent' },
  { time: '14:21', event: 'NOK rilevato',      detail: 'WO-2026-0142 · pezzo #167 — flusso Recovery avviato',    tone: 'warn' },
  { time: '14:18', event: 'WO in pausa',       detail: 'WO-2026-0141 · materiale mancante ITM-MP-00903',         tone: 'bad' },
  { time: '14:15', event: 'Skill verificata',  detail: 'OP-0142 Marco Conti · SKL-LEAK',                         tone: 'info' },
  { time: '14:12', event: 'Ricetta caricata',  detail: 'RCP-LEAK-001 v3 → DEV-LEAK-01',                          tone: 'info' },
  { time: '14:08', event: 'Login operatore',   detail: 'OP-0142 Marco Conti · WS-A2-01',                         tone: 'info' },
  { time: '14:00', event: 'Turno avviato',     detail: 'Turno A · 18 operatori timbrati',                        tone: 'info' },
]

type BigLoss = { label: string; minutes: number; tone: ProgressTone }

// TODO(PROMPT-future): replace with downtime aggregator (6 Big Losses analytics)
const MOCK_BIG_LOSSES: BigLoss[] = [
  { label: 'Guasti',           minutes: 24, tone: 'bad' },
  { label: 'Setup/Cambi',      minutes: 38, tone: 'warn' },
  { label: 'Micro-fermate',    minutes: 12, tone: 'warn' },
  { label: 'Velocità ridotta', minutes: 18, tone: 'accent' },
  { label: 'Difetti',          minutes: 9,  tone: 'warn' },
  { label: 'Avvio impianto',   minutes: 6,  tone: 'accent' },
]

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

function useEquipmentCounts() {
  return useQuery({
    queryKey: ['dashboard', 'equipment-counts'],
    queryFn: async () => {
      const res = await sdk.equipment.list({ limit: '500' } as never)
      return deriveEquipmentCounts(res.data)
    },
  })
}

function useBoxCounts() {
  return useQuery({
    queryKey: ['dashboard', 'box-counts'],
    queryFn: async () => {
      const res = await sdk.boxes.list({ limit: '500' } as never)
      return deriveBoxCounts(res.data)
    },
  })
}

export default function PlantOverviewDashboard() {
  const equipment = useEquipmentCounts()
  const boxes = useBoxCounts()

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      <PageHeader
        title="Plant Overview"
        subtitle="Stabilimento Modena · Turno A · 06:00–14:00"
      />

      {/* Row 1: KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {MOCK_KPIS.map((kpi) => (
          <KPI
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            {...(kpi.sub ? { sub: kpi.sub } : {})}
            {...(kpi.tone ? { tone: kpi.tone } : {})}
          />
        ))}
      </div>

      {/* Row 2: Active WOs (col-span-2) + Live Activity (col-span-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card padded={false} className="lg:col-span-2">
          <div className="border-b border-line px-3 h-9 flex items-center justify-between">
            <div className="font-semibold text-[12.5px]">Work Order attivi</div>
            <Link href="/workflows">
              <Button size="sm" variant="ghost" iconR={<ArrowRight className="w-3.5 h-3.5" />}>
                Tutti i Work Order
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-line">
            {MOCK_ACTIVE_WOS.map((wo) => (
              <div
                key={wo.id}
                role="row"
                className="px-3 py-2.5 grid grid-cols-[140px_1fr_140px_120px_80px] items-center gap-3 hover:bg-paper-2 cursor-pointer"
              >
                <div className="font-mono text-[12px]">{wo.code}</div>
                <div>
                  <div className="text-[12.5px] font-medium">{wo.itemName}</div>
                  <div className="text-[11px] text-ink-3">
                    {wo.workCenter} · {wo.operator}
                  </div>
                </div>
                <div>
                  <Progress
                    value={wo.qtyProduced}
                    max={wo.qtyTarget}
                    tone={wo.status === 'on_hold' ? 'warn' : 'accent'}
                  />
                  <div className="text-[11px] font-mono mt-1 text-ink-3 tabular-nums">
                    {wo.qtyProduced}/{wo.qtyTarget} pc
                  </div>
                </div>
                <StatusBadge status={wo.status} label={STATUS_LABEL_IT[wo.status] ?? undefined} />
                <PriorityBadge priority={wo.priority} />
              </div>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-line px-3 h-9 flex items-center justify-between">
            <div className="font-semibold text-[12.5px]">Attività live</div>
            <Badge tone="accent" dot>Live</Badge>
          </div>
          <div className="px-3 py-2 space-y-2 text-[12px]">
            {MOCK_ACTIVITY.map((x, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="font-mono text-[10.5px] text-ink-3 tabular-nums w-9 flex-shrink-0 pt-0.5">
                  {x.time}
                </span>
                <Dot tone={x.tone} className="mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-[12px]">{x.event}</div>
                  <div className="text-[11px] text-ink-3">{x.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: Equipment Status + 6 Big Losses + Box Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card padded={false}>
          <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-[12.5px]">
            Stato impianti
          </div>
          <div className="p-3 space-y-2">
            {equipment.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    data-testid="equipment-skeleton"
                    className="h-5 bg-paper-2 animate-pulse rounded"
                  />
                ))
              : (equipment.data ?? []).map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <Dot tone={b.tone} />
                    <span className="flex-1 text-[12px]">{b.label}</span>
                    <span className="font-mono tabular-nums text-[12.5px] font-semibold">
                      {b.count}
                    </span>
                  </div>
                ))}
            {equipment.isError && (
              <div className="text-[11px] text-bad-ink">Errore caricamento impianti</div>
            )}
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-[12.5px]">
            6 Grandi Perdite (oggi)
          </div>
          <div className="p-3 space-y-1.5">
            {MOCK_BIG_LOSSES.map((x) => (
              <div
                key={x.label}
                className="grid grid-cols-[1fr_50px_40px] items-center gap-2 text-[12px]"
              >
                <span>{x.label}</span>
                <Progress value={x.minutes} max={40} tone={x.tone} />
                <span className="font-mono tabular-nums text-right">{x.minutes}m</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-line px-3 h-9 flex items-center justify-between">
            <span className="font-semibold text-[12.5px]">Inventario imballi</span>
            <Link href="/boxes">
              <Button size="sm" variant="ghost">
                Apri
              </Button>
            </Link>
          </div>
          <div className="p-3 space-y-1.5">
            {boxes.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    data-testid="box-skeleton"
                    className="h-5 bg-paper-2 animate-pulse rounded"
                  />
                ))
              : (boxes.data ?? []).map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-[12px]">
                    <Dot tone={b.tone} />
                    <span className="flex-1">{b.label}</span>
                    <span className="font-mono tabular-nums text-[12.5px] font-semibold">
                      {b.count}
                    </span>
                  </div>
                ))}
            {boxes.isError && (
              <div className="text-[11px] text-bad-ink">Errore caricamento imballi</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
