'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'
import { StatusBadge } from '@mes/ui'

type OperatorRow = { id: string; badge: string; firstName: string; lastName: string; status: string; plantId: string }

const COLUMNS: Column<OperatorRow>[] = [
  { key: 'badge', header: 'Badge', sortable: true, width: '100px' },
  { key: 'firstName', header: 'Nome', sortable: true },
  { key: 'lastName', header: 'Cognome', sortable: true },
  {
    key: 'status',
    header: 'Stato',
    width: '90px',
    render: (r) => (
      <StatusBadge tone={r.status === 'active' ? 'ok' : 'neutral'}>{r.status === 'active' ? 'Attivo' : r.status}</StatusBadge>
    ),
  },
]

export default function OperatorsPage() {
  return (
    <RegistryListPage
      title="Operatori"
      subtitle="Anagrafica operatori di produzione"
      moduleKey="operators"
      client={sdk.operators}
      columns={COLUMNS}
      newHref="/operators/new"
    />
  )
}
