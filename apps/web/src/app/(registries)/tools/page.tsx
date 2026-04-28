'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'
import { StatusBadge } from '@mes/ui'

const WEAR_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  new: 'ok',
  good: 'ok',
  worn: 'warn',
  critical: 'bad',
  retired: 'neutral',
}

type ToolRow = { id: string; code: string; name: string; wearStatus: string; currentCyclesCount: number; maxCycles?: number | null | undefined }

const COLUMNS: Column<ToolRow>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '120px' },
  { key: 'name', header: 'Nome', sortable: true },
  {
    key: 'wearStatus',
    header: 'Usura',
    width: '90px',
    render: (r) => <StatusBadge tone={WEAR_TONE[r.wearStatus] ?? 'neutral'}>{r.wearStatus}</StatusBadge>,
  },
  {
    key: 'currentCyclesCount',
    header: 'Cicli',
    width: '80px',
    render: (r) => `${r.currentCyclesCount}${r.maxCycles ? ` / ${r.maxCycles}` : ''}`,
  },
]

export default function ToolsPage() {
  return (
    <RegistryListPage
      title="Attrezzature"
      subtitle="Mole, filiere, crimp dies — con tracking usura"
      moduleKey="tools"
      client={sdk.tools}
      columns={COLUMNS}
      newHref="/tools/new"
    />
  )
}
