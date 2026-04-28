'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'

type RecipeRow = { id: string; code: string; name: string; status: string; plantId: string }

const COLUMNS: Column<RecipeRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '120px' },
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'status', header: 'Stato', width: '120px' },
]

export default function RecipesPage() {
  return (
    <RegistryListPage
      title="Ricette"
      subtitle="Parametri di processo per ogni dispositivo"
      moduleKey="recipes"
      client={sdk.recipes}
      columns={COLUMNS}
      newHref="/recipes/new"
    />
  )
}
