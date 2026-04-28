'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'
import { StatusBadge } from '@mes/ui'

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'info' | 'neutral'> = {
  empty: 'neutral',
  loaded: 'info',
  sealed: 'ok',
  labeled: 'ok',
  dispatched: 'warn',
  returned: 'warn',
  inspecting: 'info',
  retired: 'bad',
}

type BoxRow = { id: string; code: string; status: string; currentUnitsCount: number; boxTypeId: string }

const COLUMNS: Column<BoxRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '140px' },
  {
    key: 'status',
    header: 'Stato',
    width: '100px',
    render: (r) => <StatusBadge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</StatusBadge>,
  },
  { key: 'currentUnitsCount', header: 'Pezzi', width: '70px' },
]

export default function BoxesPage() {
  return (
    <RegistryListPage
      title="Colli"
      subtitle="Istanze di collo con state machine"
      moduleKey="boxes"
      client={sdk.boxes}
      columns={COLUMNS}
      newHref="/boxes/new"
    />
  )
}
