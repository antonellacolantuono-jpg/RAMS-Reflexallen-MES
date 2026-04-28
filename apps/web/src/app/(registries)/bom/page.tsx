'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'

type BomRow = { id: string; itemId: string; version: number; status: string; notes?: string | null | undefined; createdAt: string }

const COLUMNS: Column<BomRow>[] = [
  { key: 'itemId', header: 'Articolo ID', sortable: true },
  { key: 'version', header: 'Versione', width: '80px' },
  { key: 'status', header: 'Stato', width: '120px' },
  { key: 'notes', header: 'Note', render: (r) => r.notes ?? '—' },
]

export default function BomPage() {
  return (
    <RegistryListPage
      title="Distinte Base (BOM)"
      subtitle="Gestione distinte base multi-livello"
      moduleKey="bom"
      client={sdk.bom}
      columns={COLUMNS}
      newHref="/bom/new"
    />
  )
}
