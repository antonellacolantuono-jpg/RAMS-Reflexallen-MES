'use client'
import { RegistryListPage } from '../../../components/registry/RegistryListPage'
import { sdk } from '../../../lib/sdk'
import type { Column } from '@mes/ui'
import { StatusBadge } from '@mes/ui'

const SEVERITY_TONE: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  critical: 'bad',
  warning: 'warn',
  info: 'info',
}

type ApRow = { id: string; entityType: string; severity: string; message: string; resolvedAt?: string | null | undefined }

const COLUMNS: Column<ApRow>[] = [
  { key: 'entityType', header: 'Entità', width: '120px' },
  {
    key: 'severity',
    header: 'Gravità',
    width: '90px',
    render: (r) => <StatusBadge tone={SEVERITY_TONE[r.severity] ?? 'neutral'}>{r.severity}</StatusBadge>,
  },
  { key: 'message', header: 'Messaggio' },
  {
    key: 'resolvedAt',
    header: 'Risolto',
    width: '80px',
    render: (r) => (r.resolvedAt ? '✓' : '—'),
  },
]

export default function AttentionPointsPage() {
  return (
    <RegistryListPage
      title="Punti di Attenzione"
      subtitle="Avvisi di sicurezza, qualità e normativi"
      moduleKey="attention-points"
      client={sdk.attentionPoints}
      columns={COLUMNS}
      newHref="/attention-points/new"
    />
  )
}
