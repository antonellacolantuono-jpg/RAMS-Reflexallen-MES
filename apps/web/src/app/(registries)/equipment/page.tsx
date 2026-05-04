'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import { ImageDisplay, type Column } from '@mes/ui'

type EqRow = {
  id: string
  code: string
  name: string
  level: string
  status: string
  plantId: string
  imageUrl?: string | null
}

const COLUMNS: Column<EqRow>[] = [
  {
    key: 'imageUrl',
    header: '',
    width: '48px',
    render: (row) => (
      <ImageDisplay
        src={row.imageUrl ?? null}
        alt={row.name}
        size="thumbnail"
        iconCategory="equipment"
        entityName={row.name}
      />
    ),
  },
  { key: 'code', header: 'Codice', sortable: true, width: '120px' },
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'level', header: 'Livello', width: '100px' },
  { key: 'status', header: 'Stato', width: '100px' },
]

export default function EquipmentPage() {
  return (
    <RegistryListPage
      title="Impianti e Attrezzature"
      subtitle="Gerarchia ISA-95: plant → area → work center → work unit"
      moduleKey="equipment"
      client={sdk.equipment}
      columns={COLUMNS}
      newHref="/equipment/new"
    />
  )
}
