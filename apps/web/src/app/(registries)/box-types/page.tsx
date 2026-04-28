'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'

type BoxTypeRow = { id: string; code: string; name: string; isReturnable: boolean; maxUnitsCount?: number | null | undefined; description?: string | null | undefined }

const COLUMNS: Column<BoxTypeRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '120px' },
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'isReturnable', header: 'Reso', width: '60px', render: (r) => r.isReturnable ? '✓' : '—' },
  { key: 'maxUnitsCount', header: 'Capacità (pz)', width: '110px', render: (r) => r.maxUnitsCount ?? '—' },
]

export default function BoxTypesPage() {
  return (
    <RegistryListPage
      title="Tipi Collo"
      subtitle="Configurazione pallet, cartoni, fusti"
      moduleKey="box-types"
      client={sdk.boxTypes}
      columns={COLUMNS}
      newHref="/box-types/new"
    />
  )
}
