'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal, Card, Badge } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EQUIPMENT_LEVEL_LABELS: Record<string, string> = {
  enterprise: 'Impresa',
  site: 'Sito',
  area: 'Area',
  work_center: 'Centro di lavoro',
  work_unit: 'Unità di lavoro',
  equipment_module: 'Modulo equipaggiamento',
}

const EQUIPMENT_CLASS_LABELS: Record<string, string> = {
  production: 'Produzione',
  storage: 'Stoccaggio',
  transport: 'Trasporto',
  test: 'Test',
  maintenance: 'Manutenzione',
  administrative: 'Amministrativo',
}

const EQUIPMENT_STATUS_TONES: Record<string, 'ok' | 'warn' | 'bad' | 'info' | 'neutral'> = {
  available: 'ok',
  reserved: 'info',
  in_use: 'warn',
  cleaning: 'warn',
  maintenance: 'warn',
  broken: 'bad',
  offline: 'neutral',
  decommissioned: 'neutral',
}

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  available: 'Disponibile',
  reserved: 'Riservato',
  in_use: 'In uso',
  cleaning: 'In pulizia',
  maintenance: 'In manutenzione',
  broken: 'Guasto',
  offline: 'Offline',
  decommissioned: 'Dismesso',
}

const WEAR_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  new: 'ok',
  good: 'ok',
  worn: 'warn',
  at_limit: 'bad',
  replaced: 'neutral',
}

const WEAR_LABELS: Record<string, string> = {
  new: 'Nuovo',
  good: 'Buono',
  worn: 'Usurato',
  at_limit: 'Al limite',
  replaced: 'Sostituito',
}

// TODO(post-demo): replace with sdk.devices.list({ equipmentNodeId }) when controller built
const MOCK_DEVICES = [
  { code: 'DEV-LEAK-001', name: 'Leak Tester Marposs ML-300', kind: 'leak_tester' },
  { code: 'DEV-CAMERA-001', name: 'Vision System Cognex IS-5705', kind: 'camera' },
  { code: 'DEV-CRIMP-001', name: 'Crimp Press Schäfer CP-12', kind: 'press' },
] as const

const MOCK_SKILLS = [
  { code: 'PNE-LEAK-CERT', name: 'Leak Test Certified' },
  { code: 'PNE-CRIMP', name: 'Crimp Operator' },
  { code: 'QA-VISUAL', name: 'Ispezione visiva QA' },
] as const

const MOCK_OPERATORS = [
  { name: 'Mario Rossi', badge: 'OP-001' },
  { name: 'Anna Verdi', badge: 'OP-002' },
  { name: 'Luca Bianchi', badge: 'OP-003' },
] as const

const RESOURCE_LEVELS = new Set(['work_center', 'work_unit'])

function NoticeAmber({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      {children}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: eq, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => sdk.equipment.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['equipment', id, 'audit', auditPage],
    queryFn: () => sdk.equipment.audit(id, { page: auditPage, limit: 20 }),
  })

  const showResources = !!eq && RESOURCE_LEVELS.has(eq.level)
  const { data: toolsData, isLoading: isLoadingTools } = useQuery({
    queryKey: ['equipment', id, 'tools'],
    queryFn: () => sdk.tools.list({ equipmentNodeId: id } as Record<string, unknown>),
    enabled: showResources,
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.equipment.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['equipment'] })
      router.push('/equipment')
    },
  })

  if (!eq && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Equipaggiamento non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: eq ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', eq.code],
            ['Nome', eq.name],
            ['Livello ISA-95', EQUIPMENT_LEVEL_LABELS[eq.level] ?? eq.level],
            ['Classe', EQUIPMENT_CLASS_LABELS[eq.class] ?? eq.class],
            ['Plant ID', eq.plantId],
            ['Parent ID', eq.parentId ?? '— (nodo radice)'],
            ['Creato il', new Date(eq.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(eq.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
          {eq.description && (
            <div className="col-span-2">
              <dt className="text-neutral-500 font-medium">Descrizione</dt>
              <dd className="text-neutral-800 mt-0.5">{eq.description}</dd>
            </div>
          )}
        </dl>
      ) : null,
    },
    {
      key: 'hierarchy',
      label: 'Gerarchia',
      content: (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            La visualizzazione completa della gerarchia ISA-95 sarà disponibile in un batch successivo.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Vista albero a 5 livelli (impresa → sito → area → centro di lavoro → unità) in arrivo post-demo (TODO-052).
          </p>
          {eq?.parentId && (
            <p className="mt-3 text-xs text-neutral-700">
              Parent ID corrente: <span className="font-mono">{eq.parentId}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'activity',
      label: 'Attività',
      content: (
        <ActivityFeed
          entries={auditEntries}
          isLoading={isFetchingAudit}
          hasMore={hasMoreAudit}
          onLoadMore={() => setAuditPage((p) => p + 1)}
        />
      ),
    },
  ]

  if (showResources) {
    const tools = (toolsData?.data ?? []) as Array<{
      id: string
      code: string
      name: string
      wearStatus: string
      currentCyclesCount: number
      maxCycles?: number | null
    }>
    tabs.splice(2, 0, {
      key: 'resources',
      label: 'Risorse',
      content: (
        <div className="space-y-6">
          <section data-testid="resources-devices">
            <SectionHeader title="Dispositivi" subtitle="Strumenti collegati alla postazione" />
            <Card>
              <ul className="divide-y divide-neutral-100">
                {MOCK_DEVICES.map((d) => (
                  <li key={d.code} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="font-mono text-xs text-neutral-500">{d.code}</div>
                      <div className="text-neutral-800">{d.name}</div>
                    </div>
                    <Badge tone="info">{d.kind}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="mt-2">
              <NoticeAmber>Vista dispositivi: gestione completa in arrivo post-demo</NoticeAmber>
            </div>
          </section>

          <section data-testid="resources-tools">
            <SectionHeader title="Attrezzature" subtitle="Stampi, mole, dies con tracking usura" />
            <Card>
              {isLoadingTools ? (
                <div className="py-3 text-xs text-neutral-500">Caricamento attrezzature…</div>
              ) : tools.length === 0 ? (
                <div className="py-3 text-xs text-neutral-500">Nessuna attrezzatura assegnata.</div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {tools.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="font-mono text-xs text-neutral-500">{t.code}</div>
                        <div className="text-neutral-800">{t.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-500 tabular-nums">
                          {t.currentCyclesCount}
                          {t.maxCycles ? ` / ${t.maxCycles}` : ''}
                        </span>
                        <StatusBadge tone={WEAR_TONE[t.wearStatus] ?? 'neutral'}>
                          {WEAR_LABELS[t.wearStatus] ?? t.wearStatus}
                        </StatusBadge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section data-testid="resources-materials">
            <SectionHeader title="Materiali" subtitle="Componenti BoM disponibili in postazione" />
            <NoticeAmber>Materiali per postazione: configurazione in arrivo</NoticeAmber>
          </section>

          <section data-testid="resources-skills">
            <SectionHeader title="Skill richieste" subtitle="Certificazioni necessarie per operare" />
            <Card>
              <ul className="divide-y divide-neutral-100">
                {MOCK_SKILLS.map((s) => (
                  <li key={s.code} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="font-mono text-xs text-neutral-500">{s.code}</div>
                      <div className="text-neutral-800">{s.name}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="mt-2">
              <NoticeAmber>
                Configurazione Skill richieste per postazione: editor in arrivo (TODO-053)
              </NoticeAmber>
            </div>
          </section>

          <section data-testid="resources-operators">
            <SectionHeader title="Operatori abilitati" subtitle="Roster con certificazioni valide" />
            <Card>
              <ul className="divide-y divide-neutral-100">
                {MOCK_OPERATORS.map((o) => (
                  <li key={o.badge} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="font-mono text-xs text-neutral-500">{o.badge}</div>
                      <div className="text-neutral-800">{o.name}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="mt-2">
              <NoticeAmber>
                Roster operatori abilitati: editor in arrivo (TODO-054)
              </NoticeAmber>
            </div>
          </section>
        </div>
      ),
    })
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <EntityDetail
        isLoading={isLoading}
        breadcrumbs={[{ label: 'Equipaggiamenti', href: '/equipment' }, { label: eq?.code ?? '' }]}
        title={eq?.name ?? ''}
        subtitle={eq ? `${eq.code} · ${EQUIPMENT_LEVEL_LABELS[eq.level] ?? eq.level}` : ''}
        badge={eq ? (
          <StatusBadge tone={EQUIPMENT_STATUS_TONES[eq.status] ?? 'neutral'}>
            {EQUIPMENT_STATUS_LABELS[eq.status] ?? eq.status}
          </StatusBadge>
        ) : undefined}
        actions={
          eq ? (
            <>
              <Link
                href={`/equipment/${id}/edit`}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Modifica
              </Link>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-md border border-error-200 px-3 py-1.5 text-sm font-medium text-error-700 hover:bg-error-50"
              >
                Elimina
              </button>
            </>
          ) : undefined
        }
        tabs={tabs}
        onNavigate={(href) => router.push(href)}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Elimina equipaggiamento"
        description={`Vuoi eliminare "${eq?.name}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
