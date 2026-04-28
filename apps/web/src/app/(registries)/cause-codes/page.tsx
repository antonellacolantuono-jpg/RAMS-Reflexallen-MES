'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'

type CauseCodeRow = { id: string; code: string; name: string; category: string; description?: string | null | undefined }

const COLUMNS: Column<CauseCodeRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '100px' },
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'category', header: 'Categoria', width: '120px' },
  { key: 'description', header: 'Descrizione', render: (r) => r.description ?? '—' },
]

export default function CauseCodesPage() {
  return (
    <RegistryListPage
      title="Codici Causa"
      subtitle="Categorie difetti, scarti e fermi macchina"
      moduleKey="cause-codes"
      client={sdk.causeCodes}
      columns={COLUMNS}
      newHref="/cause-codes/new"
    />
  )
}
