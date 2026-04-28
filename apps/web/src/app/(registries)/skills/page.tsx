'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'

type SkillRow = { id: string; code: string; name: string; category: string; plantId: string }

const COLUMNS: Column<SkillRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '100px' },
  { key: 'name', header: 'Nome', sortable: true },
  { key: 'category', header: 'Categoria', width: '120px' },
]

export default function SkillsPage() {
  return (
    <RegistryListPage
      title="Competenze"
      subtitle="Matrice operatori × skill — certificazioni e scadenze"
      moduleKey="skills"
      client={sdk.skills}
      columns={COLUMNS}
      newHref="/skills/new"
    />
  )
}
