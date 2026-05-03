'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Card,
  KPI,
  PriorityBadge,
  Progress,
  StatusBadge,
  Tabs,
  type Priority,
  type StatusValue,
} from '@mes/ui'
import type {
  WorkOrderDetailModel,
  WorkOrderSnapshotPhaseModel,
} from '@mes/sdk'
import { sdk } from '../../../../lib/sdk'

// PROMPT_DESIGN_ALIGNMENT D3 batch 9 — Work Order back-office detail.
// Mockup reference: design-system/source/project/screens-2.jsx ScreenWODetail.
// 7 horizontal tabs: Overview · Workflow Snapshot · Materials · Execution ·
// Quality · Genealogy · Activity. Real data from GET /api/work-orders/:id;
// tabs that depend on backend modules not yet built (multi-level timer, scrap-
// by-cause aggregator, full forward+backward genealogy) use clearly-marked
// placeholders.

const TAB_IDS = ['overview', 'workflow', 'materials', 'execution', 'quality', 'genealogy', 'activity'] as const
type TabId = (typeof TAB_IDS)[number]

const PRIORITY_VALUES: ReadonlySet<string> = new Set<Priority>(['low', 'normal', 'high', 'urgent'])
function asPriority(p: string): Priority {
  return PRIORITY_VALUES.has(p) ? (p as Priority) : 'normal'
}

const PHASE_COLOR: Record<string, string> = {
  inbound: 'var(--c-inbound)',
  setup: 'var(--c-setup)',
  production: 'var(--c-production)',
  quality_control: 'var(--c-qc)',
  outbound: 'var(--c-outbound)',
  teardown: 'var(--c-teardown)',
}

function formatDateTimeIt(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [tab, setTab] = React.useState<TabId>('overview')

  const { data: wo, isLoading, error } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => sdk.workOrders.get(id),
  })

  const { data: auditData } = useQuery({
    queryKey: ['work-order', id, 'audit'],
    queryFn: () => sdk.workOrders.audit(id),
    enabled: tab === 'activity',
  })

  if (isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Caricamento ordine di lavoro…</div>
  }
  if (error || !wo) {
    return (
      <div className="p-6 text-sm text-bad-ink">
        Ordine di lavoro non trovato (id: <span className="font-mono">{id}</span>).
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Panoramica' },
    { id: 'workflow', label: 'Snapshot workflow' },
    { id: 'materials', label: 'Materiali' },
    { id: 'execution', label: 'Esecuzione', count: wo.stepExecutionStats.total },
    { id: 'quality', label: 'Qualità' },
    { id: 'genealogy', label: 'Genealogia' },
    { id: 'activity', label: 'Attività' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WODetailHeader wo={wo} />
      <div className="px-5 border-b border-line">
        <Tabs tabs={tabs} value={tab} onChange={(v) => setTab(v as TabId)} />
      </div>
      <div className="flex-1 overflow-auto p-5">
        {tab === 'overview' && <OverviewTab wo={wo} />}
        {tab === 'workflow' && <WorkflowSnapshotTab wo={wo} />}
        {tab === 'materials' && <MaterialsTab wo={wo} />}
        {tab === 'execution' && <ExecutionTab wo={wo} />}
        {tab === 'quality' && <QualityTab wo={wo} />}
        {tab === 'genealogy' && <GenealogyTab wo={wo} />}
        {tab === 'activity' && <ActivityTab entries={auditData?.data ?? []} />}
      </div>
    </div>
  )
}

// ============================================================
// HEADER (breadcrumb + title row + subtitle + actions)
// ============================================================

function WODetailHeader({ wo }: { wo: WorkOrderDetailModel }) {
  const itemSubtitle = `${wo.item.name} · ${wo.item.code}`
  const showRelease = wo.status === 'planned'
  const showHold = wo.status === 'in_progress'
  const showResume = wo.status === 'on_hold'

  return (
    <div className="px-5 py-3 border-b border-line flex items-center justify-between flex-shrink-0">
      <div className="min-w-0">
        <div className="text-xs text-ink-3 mb-1">
          <Link href="/" className="hover:text-ink">Work Orders</Link>
          <span className="mx-1">/</span>
          <span className="font-mono">{wo.code}</span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
          <span className="font-mono">{wo.code}</span>
          <StatusBadge status={wo.status as StatusValue} />
          <PriorityBadge priority={asPriority(wo.priority)} />
        </h1>
        <div className="text-xs text-ink-3 mt-0.5">{itemSubtitle}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-paper-2"
        >
          Audit log
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-paper-2"
        >
          Modifica
        </button>
        {showRelease && (
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
          >
            Rilascia
          </button>
        )}
        {showHold && (
          <button
            type="button"
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-paper-2"
          >
            Pausa
          </button>
        )}
        {showResume && (
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
          >
            Riprendi
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// OVERVIEW TAB
// ============================================================

function OverviewTab({ wo }: { wo: WorkOrderDetailModel }) {
  const phases = wo.workflowSnapshot?.snapshotData?.phases ?? []
  const totalSteps = phases.reduce(
    (acc, p) => acc + p.groups.reduce((a, g) => a + g.steps.length, 0),
    0,
  )
  // Per-phase pseudo-progress: distribute the WO's overall qty progress across
  // phases proportional to step count. Real per-phase tracking lands when
  // PROMPT_8 ships (TODO-056).
  const overallPct = wo.qtyTarget > 0 ? wo.qtyProduced / wo.qtyTarget : 0
  const phaseProgress = phases.map((p) => {
    const stepCount = p.groups.reduce((a, g) => a + g.steps.length, 0)
    const weight = totalSteps > 0 ? stepCount / totalSteps : 0
    const pct = Math.min(100, Math.round(overallPct * 100 * (1 + weight * 0.5)))
    return { phase: p, pct, stepCount }
  })

  const releasedLine = wo.releasedAt
    ? `${formatDateTimeIt(wo.releasedAt)}${wo.releasedBy ? ` · ${wo.releasedBy}` : ''}`
    : '—'
  const acceptedAssignment = wo.assignments.find((a) => a.status === 'accepted' || a.status === 'active')
  const operatorLine = acceptedAssignment
    ? `${acceptedAssignment.operatorName} · ${acceptedAssignment.operatorBadge}`
    : wo.assignments[0]
      ? `${wo.assignments[0].operatorName} · ${wo.assignments[0].operatorBadge}`
      : '—'

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <Card><KPI label="Target" value={wo.qtyTarget} unit="pz" /></Card>
          <Card><KPI label="Prodotti" value={wo.qtyProduced} unit="pz" tone="ok" /></Card>
          <Card>
            <KPI
              label="Scarto"
              value={wo.qtyScrap}
              unit="pz"
              tone={wo.qtyScrap > 0 ? 'bad' : 'default'}
            />
          </Card>
          <Card>
            <KPI
              label="Rilavorati"
              value={wo.qtyRework}
              unit="pz"
              tone={wo.qtyRework > 0 ? 'warn' : 'default'}
            />
          </Card>
        </div>

        <Card padded={false}>
          <div className="border-b border-line px-3 h-9 flex items-center justify-between">
            <span className="font-semibold text-sm">Avanzamento per fase</span>
            <span className="text-xs text-ink-3 font-mono">snapshot bloccato al rilascio</span>
          </div>
          <div className="p-3 space-y-2">
            {phaseProgress.length === 0 ? (
              <div className="text-xs text-ink-3">Nessuno snapshot disponibile (WO non ancora rilasciato).</div>
            ) : (
              phaseProgress.map(({ phase, pct, stepCount }) => (
                <div
                  key={phase.id}
                  className="grid grid-cols-[8px_180px_1fr_60px_80px] items-center gap-3 text-sm"
                >
                  <span
                    className="block w-1 h-4 rounded-sm"
                    style={{ background: PHASE_COLOR[phase.category] ?? 'var(--ink-3)' }}
                    aria-hidden
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">{phase.name}</span>
                    {phase.isAutoGenerated && (
                      <Badge tone="accent" className="!text-[10px] !py-0">AUTO</Badge>
                    )}
                  </div>
                  <Progress
                    value={pct}
                    max={100}
                    tone={pct === 100 ? 'ok' : pct > 0 ? 'accent' : 'accent'}
                  />
                  <span className="font-mono tabular-nums text-right text-ink-3">{pct}%</span>
                  <span className="font-mono text-xs text-ink-3 text-right">{stepCount} step</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-sm">
            Timer multi-livello
          </div>
          <div className="grid grid-cols-3 divide-x divide-line">
            {[
              { l: 'Work Order', planned: '32h 00m', actual: wo.actualStart ? '—' : '—', tone: 'ok' as const, status: 'In esecuzione' },
              { l: 'Fase: Production', planned: '24h 00m', actual: '—', tone: 'accent' as const, status: 'In corso' },
              { l: `Pezzo corrente #${wo.qtyProduced + 1}`, planned: '08m 30s', actual: '—', tone: 'ok' as const, status: 'In corso' },
            ].map((t) => (
              <div key={t.l} className="p-3">
                <div className="text-xs uppercase tracking-wider text-ink-3 font-medium">{t.l}</div>
                <div
                  className="text-2xl font-semibold font-mono tabular-nums mt-1"
                  style={{ color: `var(--${t.tone})` }}
                >
                  {t.actual}
                </div>
                <div className="text-xs text-ink-3 font-mono">/ {t.planned} pianificati</div>
                <Badge tone={t.tone} className="mt-1.5">{t.status}</Badge>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-line text-xs text-ink-3">
            {/* TODO-056: live timer aggregation per WO/phase/part landed in PROMPT_8 */}
            Timer multi-livello: aggregazione live disponibile post PROMPT_8.
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <Card>
          <div className="text-xs uppercase tracking-wider text-ink-3 font-medium mb-2">Pianificazione</div>
          <DlList
            rows={[
              ['Inizio pianificato', formatDateTimeIt(wo.scheduledStart)],
              ['Fine pianificata', formatDateTimeIt(wo.scheduledEnd)],
              ['Inizio effettivo', formatDateTimeIt(wo.actualStart)],
              ['Rilasciato', releasedLine],
            ]}
          />
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-ink-3 font-medium mb-2">Assegnazione</div>
          <DlList
            rows={[
              ['Operatore', operatorLine],
              ['Tipo', wo.type],
              ['Workflow', wo.workflowSnapshot ? `v${wo.workflowSnapshot.snapshotData?.workflowVersionNumber ?? '?'}` : '—'],
            ]}
          />
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-ink-3 font-medium mb-2">Riserve</div>
          <DlList
            rows={[
              ['Articolo', `${wo.item.name}`],
              ['UoM', wo.item.uom],
              ['Componenti BoM', wo.bom ? `${wo.bom.lines.length}` : 'Nessun BoM associato'],
            ]}
          />
        </Card>
        {wo.notes && (
          <Card>
            <div className="text-xs uppercase tracking-wider text-ink-3 font-medium mb-2">Note</div>
            <div className="text-sm text-ink-2 whitespace-pre-wrap">{wo.notes}</div>
          </Card>
        )}
      </div>
    </div>
  )
}

function DlList({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-ink-3">{k}</dt>
          <dd className="text-right text-ink-2">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

// ============================================================
// WORKFLOW SNAPSHOT TAB
// ============================================================

function WorkflowSnapshotTab({ wo }: { wo: WorkOrderDetailModel }) {
  const snap = wo.workflowSnapshot
  if (!snap) {
    return (
      <div className="rounded-md border border-line bg-paper p-4 text-sm text-ink-3">
        Snapshot non ancora creato. Verrà generato al rilascio del Work Order.
      </div>
    )
  }
  const phases = snap.snapshotData?.phases ?? []
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-line bg-accent-soft text-accent-ink p-2.5 text-sm flex items-center gap-2">
        <span aria-hidden>🔒</span>
        Snapshot bloccato al rilascio · v{snap.snapshotData?.workflowVersionNumber ?? '?'} ·{' '}
        {formatDateTimeIt(snap.createdAt)}
      </div>
      {phases.map((p) => <PhaseCard key={p.id} phase={p} />)}
    </div>
  )
}

function PhaseCard({ phase }: { phase: WorkOrderSnapshotPhaseModel }) {
  const totalSteps = phase.groups.reduce((a, g) => a + g.steps.length, 0)
  return (
    <div className="rounded-md border border-line bg-paper">
      <div
        className="px-3 h-9 flex items-center gap-2 border-b border-line"
        style={{ borderLeft: `3px solid ${PHASE_COLOR[phase.category] ?? 'var(--ink-3)'}` }}
      >
        <span className="font-semibold text-sm">{phase.name}</span>
        {phase.isAutoGenerated && (
          <Badge tone="accent" className="!text-[10px]">AUTO-GEN</Badge>
        )}
        <span className="ml-auto font-mono text-xs text-ink-3">
          {phase.groups.length} gruppi · {totalSteps} step
        </span>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2">
        {phase.groups.map((g) => (
          <div key={g.id} className="rounded border border-line bg-paper-2 p-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm font-medium">{g.name}</span>
              {g.isAutoGenerated && (
                <Badge tone="accent" className="!text-[10px]">AUTO</Badge>
              )}
              <span className="ml-auto font-mono text-xs text-ink-3">{g.category}</span>
            </div>
            <div className="space-y-1">
              {g.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono text-ink-3 w-6 text-right">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 truncate">{s.name}</span>
                  {s.deviceCategory === 'parallel' && (
                    <Badge tone="info" className="!text-[10px]">∥ {s.partReference ?? 'parallel'}</Badge>
                  )}
                  {s.standardTimeSec && (
                    <span className="font-mono text-[10px] text-ink-3">{s.standardTimeSec}s</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MATERIALS TAB
// ============================================================

function MaterialsTab({ wo }: { wo: WorkOrderDetailModel }) {
  if (!wo.bom) {
    return (
      <div className="rounded-md border border-line bg-paper p-4 text-sm text-ink-3">
        Nessun BoM associato a questo ordine di lavoro.
      </div>
    )
  }
  const ratio = wo.qtyTarget > 0 ? wo.qtyProduced / wo.qtyTarget : 0
  return (
    <Card padded={false}>
      <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-sm">
        Materiali riservati · BoM consumato
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-ink-3">
            <th className="text-left px-3 py-2 text-xs uppercase tracking-wider font-medium">Componente</th>
            <th className="text-right px-2 py-2 text-xs uppercase tracking-wider font-medium">Richiesto</th>
            <th className="text-right px-2 py-2 text-xs uppercase tracking-wider font-medium">Consumato</th>
            <th className="text-left px-2 py-2 text-xs uppercase tracking-wider font-medium">UoM</th>
            <th className="text-right px-3 py-2 text-xs uppercase tracking-wider font-medium pr-4">Avanzamento</th>
          </tr>
        </thead>
        <tbody>
          {wo.bom.lines.map((l) => {
            const required = l.qty * wo.qtyTarget
            const consumed = +(l.qty * wo.qtyProduced).toFixed(2)
            return (
              <tr key={l.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">
                  <div className="font-medium">{l.componentName}</div>
                  <div className="font-mono text-xs text-ink-3">{l.componentCode}</div>
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-right">{required}</td>
                <td className="px-2 py-2 font-mono tabular-nums text-right">{consumed}</td>
                <td className="px-2 py-2 text-ink-3">{l.uom}</td>
                <td className="px-3 py-2 pr-4 w-[160px]">
                  <Progress value={ratio * 100} max={100} tone="ok" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-line text-xs text-ink-3">
        {/* TODO-057: lot-level reservations + per-component quality status (approved/quarantine)
            require the lot-tracking pipeline (PROMPT_9). Required/consumed here derive from
            BoM × WO progress as a stand-in. */}
        Tracciamento lotti per componente disponibile post PROMPT_9.
      </div>
    </Card>
  )
}

// ============================================================
// EXECUTION TAB
// ============================================================

function ExecutionTab({ wo }: { wo: WorkOrderDetailModel }) {
  const stats = wo.stepExecutionStats
  const fpyDenom = stats.done + stats.nok
  const fpy = fpyDenom > 0 ? ((stats.done / fpyDenom) * 100).toFixed(1) : '—'
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <Card><KPI label="Step totali" value={stats.total} /></Card>
        <Card><KPI label="Completati" value={stats.done} tone="ok" /></Card>
        <Card><KPI label="In corso" value={stats.running} tone="info" /></Card>
        <Card><KPI label="FPY" value={fpy} unit="%" tone="ok" /></Card>
      </div>
      <Card padded={false}>
        <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-sm">
          Cicli recenti
        </div>
        <div className="p-3 text-sm text-ink-3">
          {/* TODO-058: per-cycle list (serial · started · cycle time · operator · outcome)
              requires ProductionRecord aggregation endpoint — lands with PROMPT_6 dashboard. */}
          Vista cicli per pezzo disponibile post PROMPT_6 (dashboard reporting).
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// QUALITY TAB
// ============================================================

function QualityTab({ wo }: { wo: WorkOrderDetailModel }) {
  const ok = wo.qtyProduced - wo.qtyScrap - wo.qtyRework
  const total = Math.max(1, wo.qtyProduced)
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card padded={false}>
        <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-sm">
          Esiti qualità
        </div>
        <div className="p-3 grid grid-cols-3 gap-3">
          <KPI label="OK" value={Math.max(0, ok)} tone="ok" sub={`${((Math.max(0, ok) / total) * 100).toFixed(1)}%`} />
          <KPI
            label="Rilavorati"
            value={wo.qtyRework}
            tone={wo.qtyRework > 0 ? 'warn' : 'default'}
            sub={`${((wo.qtyRework / total) * 100).toFixed(1)}%`}
          />
          <KPI
            label="Scarto"
            value={wo.qtyScrap}
            tone={wo.qtyScrap > 0 ? 'bad' : 'default'}
            sub={`${((wo.qtyScrap / total) * 100).toFixed(1)}%`}
          />
        </div>
      </Card>
      <Card padded={false}>
        <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-sm">
          Scarto per causale
        </div>
        <div className="p-3 text-sm text-ink-3">
          {/* TODO-059: scrap-by-cause breakdown requires grouping ProductionRecord
              by causeCode — wires after PROMPT_PNE_5 cause-code linking lands. */}
          Aggregazione per causale disponibile post PROMPT_PNE_5.
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// GENEALOGY TAB
// ============================================================

function GenealogyTab({ wo }: { wo: WorkOrderDetailModel }) {
  return (
    <Card padded={false}>
      <div className="border-b border-line px-3 h-9 flex items-center font-semibold text-sm">
        Genealogia · {wo.code}
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="rounded border border-line bg-paper-2 p-2">
          <div className="font-semibold font-mono">{wo.code} · {wo.item.name}</div>
          <div className="text-xs text-ink-3 mt-0.5">
            Codice articolo <span className="font-mono">{wo.item.code}</span> · Target{' '}
            {wo.qtyTarget} {wo.item.uom} · Prodotti {wo.qtyProduced}
          </div>
        </div>
        {wo.bom && wo.bom.lines.length > 0 && (
          <div className="pl-4 space-y-1.5 border-l border-line ml-3">
            {wo.bom.lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <span className="block w-1.5 h-1.5 rounded-full bg-info" aria-hidden />
                <span className="font-mono text-xs">{l.componentCode}</span>
                <span className="text-ink-2">·</span>
                <span>{l.componentName}</span>
                <span className="ml-auto font-mono text-xs text-ink-3">
                  {l.qty} {l.uom}/pz
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-line text-xs text-ink-3">
        {/* TODO-060: forward genealogy (serial → finished good) + lot tracing land with
            PROMPT_9 (lot/genealogy module). */}
        Genealogia completa forward + backward per serial number disponibile post PROMPT_9.
      </div>
    </Card>
  )
}

// ============================================================
// ACTIVITY TAB
// ============================================================

type ActivityEntry = {
  id: string
  changedAt: string
  action: string
  changedBy: string
}

function ActivityTab({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-line bg-paper p-4 text-sm text-ink-3">
        Nessuna attività registrata per questo ordine di lavoro.
      </div>
    )
  }
  return (
    <div className="rounded-md border border-line bg-paper p-3 space-y-2">
      {entries.map((e) => (
        <div
          key={e.id}
          className="grid grid-cols-[140px_140px_1fr] gap-3 text-sm border-b border-line last:border-0 pb-2 last:pb-0"
        >
          <span className="font-mono text-xs text-ink-3 tabular-nums">
            {formatDateTimeIt(e.changedAt)}
          </span>
          <span className="font-medium capitalize">{e.action.replace(/_/g, ' ')}</span>
          <div>
            <span className="text-ink-3">{e.changedBy}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

