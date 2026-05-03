'use client'

import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'
import { StatusBadge, PriorityBadge } from '@mes/ui'

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'neutral' | 'info'> = {
  scheduled: 'info',
  in_progress: 'warn',
  completed: 'ok',
  cancelled: 'neutral',
  overdue: 'bad',
  deferred: 'neutral',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Pianificata',
  in_progress: 'In corso',
  completed: 'Completata',
  cancelled: 'Annullata',
  overdue: 'Scaduta',
  deferred: 'Differita',
}

const TYPE_LABEL: Record<string, string> = {
  preventive: 'Preventiva',
  corrective: 'Correttiva',
  calibration: 'Calibrazione',
  inspection: 'Ispezione',
}

type MntRow = {
  id: string
  code: string
  type: string
  status: string
  priority: string
  plannedStart: string
  description: string
  equipmentNode?: { code: string; name: string } | null
}

const COLUMNS: Column<MntRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '140px' },
  {
    key: 'equipmentNode',
    header: 'Impianto',
    width: '200px',
    render: (r) => r.equipmentNode ? `${r.equipmentNode.code} · ${r.equipmentNode.name}` : '—',
  },
  {
    key: 'type',
    header: 'Tipo',
    width: '120px',
    render: (r) => TYPE_LABEL[r.type] ?? r.type,
  },
  {
    key: 'status',
    header: 'Stato',
    width: '110px',
    render: (r) => (
      <StatusBadge tone={STATUS_TONE[r.status] ?? 'neutral'}>
        {STATUS_LABEL[r.status] ?? r.status}
      </StatusBadge>
    ),
  },
  {
    key: 'plannedStart',
    header: 'Inizio pianificato',
    sortable: true,
    width: '150px',
    render: (r) => new Date(r.plannedStart).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
  },
  {
    key: 'priority',
    header: 'Priorità',
    width: '100px',
    render: (r) => <PriorityBadge priority={r.priority as never} />,
  },
]

export default function MaintenanceOrdersPage() {
  return (
    <RegistryListPage
      title="Manutenzioni"
      subtitle="Ordini di manutenzione preventiva, correttiva, calibrazione e ispezione"
      moduleKey="maintenance-orders"
      client={sdk.maintenanceOrders}
      columns={COLUMNS as Column<{ id: string }>[]}
      newHref="/maintenance-orders/new"
    />
  )
}
