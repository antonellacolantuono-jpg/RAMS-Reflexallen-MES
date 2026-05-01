'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button } from '@mes/ui'
import { useMe, useQcReviewList } from '../../lib/queries'
import { ApiError } from '../../lib/api-client'

function formatDuration(sec: number | null): string {
  if (!sec || sec <= 0) return '—'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function QcReviewListPage() {
  const router = useRouter()
  const me = useMe()
  const list = useQcReviewList({ enabled: !!me.data })

  const isUnauthorized =
    me.error instanceof ApiError && me.error.status === 401

  React.useEffect(() => {
    if (isUnauthorized) {
      router.replace('/')
    }
  }, [isUnauthorized, router])

  React.useEffect(() => {
    if (!me.data) return
    const skillCodes = me.data.skillCodes ?? []
    if (!skillCodes.includes('QC')) {
      router.replace('/dashboard')
    }
  }, [me.data, router])

  if (me.isLoading || !me.data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-3">Caricamento…</p>
      </div>
    )
  }

  const items = list.data ?? []

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="md"
              variant="ghost"
              onClick={() => router.replace('/dashboard')}
            >
              ← Dashboard
            </Button>
            <div className="flex flex-col">
              <span className="text-xs text-ink-3 uppercase tracking-wide">
                Revisione QC
              </span>
              <h1 className="text-lg font-semibold text-ink">
                Step in attesa di approvazione
              </h1>
            </div>
          </div>
          <Badge tone="info">
            {items.length} {items.length === 1 ? 'attesa' : 'attese'}
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-3">
        {list.isLoading ? (
          <p className="text-ink-3 text-center py-8">Caricamento…</p>
        ) : items.length === 0 ? (
          <div className="glass rounded-3 p-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">✓</span>
            <h2 className="text-lg font-semibold text-ink">
              Nessuno step in attesa
            </h2>
            <p className="text-sm text-ink-3 max-w-sm">
              Tutti gli step di controllo qualità risultano risolti.
            </p>
          </div>
        ) : (
          items.map((it) => (
            <button
              key={it.stepExecutionId}
              onClick={() => router.push(`/qc-review/${it.stepExecutionId}`)}
              className="glass rounded-3 p-4 flex items-center justify-between gap-4 text-left hover:bg-paper-2 transition-colors"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="info">{it.workOrderCode}</Badge>
                  <Badge tone="warn">In attesa QC</Badge>
                </div>
                <h3 className="font-semibold text-ink truncate">
                  {it.stepName}
                </h3>
                <p className="text-xs text-ink-3">
                  Operatore: {it.operatorBadge ?? '—'} · Durata{' '}
                  {formatDuration(it.durationSec)}
                </p>
              </div>
              <span className="text-2xl text-ink-3">→</span>
            </button>
          ))
        )}
      </main>
    </div>
  )
}
