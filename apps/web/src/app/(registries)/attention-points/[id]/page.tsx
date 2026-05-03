'use client'

import { useQuery } from '@tanstack/react-query'
import { EntityDetail, StatusBadge } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SEVERITY_TONE: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  critical: 'bad',
  warning: 'warn',
  info: 'info',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critico',
  warning: 'Avviso',
  info: 'Informativo',
}

export default function AttentionPointDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const { data: ap, isLoading } = useQuery({
    queryKey: ['attention-points', id],
    queryFn: () => sdk.attentionPoints.get(id),
  })

  if (!ap && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Punto di attenzione non trovato.</div>
  }

  const isResolved = ap?.resolvedAt != null

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: ap ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Tipo entità', ap.entityType],
            ['ID entità', ap.entityId],
            ['Gravità', SEVERITY_LABELS[ap.severity] ?? ap.severity],
            ['Plant ID', ap.plantId],
            ['Creato il', new Date(ap.createdAt).toLocaleString('it-IT')],
            ['Creato da', ap.createdBy],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5 break-all">{value ?? '—'}</dd>
            </div>
          ))}
          <div className="col-span-2">
            <dt className="text-neutral-500 font-medium">Messaggio</dt>
            <dd className="text-neutral-800 mt-0.5">{ap.message}</dd>
          </div>
        </dl>
      ) : null,
    },
    {
      key: 'lifecycle',
      label: 'Risoluzione',
      content: ap ? (
        isResolved ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900">Risolto</p>
              <p className="mt-1 text-xs text-green-800">
                Punto di attenzione chiuso il{' '}
                {new Date(ap.resolvedAt as string).toLocaleString('it-IT')} da{' '}
                <span className="font-mono">{ap.resolvedBy}</span>.
              </p>
            </div>
            {ap.resolveNote && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Nota di risoluzione</p>
                <p className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{ap.resolveNote}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Aperto</p>
              <p className="mt-1 text-xs text-amber-800">
                Questo punto di attenzione è in attesa di risoluzione. Aggiungi una nota e contrassegnalo come risolto.
              </p>
            </div>
            <Link
              href={`/attention-points/${id}/edit`}
              className="self-start rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Risolvi
            </Link>
          </div>
        )
      ) : null,
    },
  ]

  return (
    <div className="p-6 h-full overflow-y-auto">
      <EntityDetail
        isLoading={isLoading}
        breadcrumbs={[{ label: 'Punti di Attenzione', href: '/attention-points' }, { label: ap?.id.slice(0, 8) ?? '' }]}
        title={ap ? (ap.message.length > 80 ? ap.message.slice(0, 77) + '…' : ap.message) : ''}
        subtitle={ap ? `${ap.entityType} · ${SEVERITY_LABELS[ap.severity] ?? ap.severity}` : ''}
        badge={ap ? (
          isResolved ? (
            <StatusBadge tone="ok">Risolto</StatusBadge>
          ) : (
            <StatusBadge tone={SEVERITY_TONE[ap.severity] ?? 'neutral'}>
              {SEVERITY_LABELS[ap.severity] ?? ap.severity}
            </StatusBadge>
          )
        ) : undefined}
        actions={
          ap && !isResolved ? (
            <Link
              href={`/attention-points/${id}/edit`}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Risolvi
            </Link>
          ) : undefined
        }
        tabs={tabs}
        onNavigate={(href) => router.push(href)}
      />
    </div>
  )
}
