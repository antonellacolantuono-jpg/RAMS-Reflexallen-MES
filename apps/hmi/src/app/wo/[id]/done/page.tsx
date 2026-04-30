'use client'
import * as React from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@mes/ui'
import { useOperatorStore } from '../../../../lib/operator-store'
import { getWorkOrder } from '../../../../lib/mock-data'

function formatDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec}s`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function WorkOrderDonePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const operator = useOperatorStore((s) => s.operator)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (hydrated && !operator) {
      router.replace('/')
    }
  }, [hydrated, operator, router])

  if (!hydrated || !operator) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-3">Caricamento…</p>
      </div>
    )
  }

  const wo = getWorkOrder(params.id)
  const okCount = Number(searchParams.get('ok') ?? 0)
  const nokCount = Number(searchParams.get('nok') ?? 0)
  const timeSec = Number(searchParams.get('time') ?? 0)

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md glass rounded-3 p-8 flex flex-col items-center gap-6 text-center">
        <div className="h-20 w-20 rounded-full bg-ok flex items-center justify-center text-white text-5xl font-bold">
          ✓
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">
            Ordine di lavoro completato!
          </h1>
          {wo && (
            <p className="text-ink-2">
              <span className="font-semibold text-ink">{wo.code}</span> ·{' '}
              {wo.itemName}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-4 w-full">
          <div className="flex flex-col gap-1 rounded-2 bg-paper-2 px-3 py-3">
            <dt className="text-xs text-ink-3 uppercase tracking-wide">
              Tempo totale
            </dt>
            <dd className="text-lg font-semibold text-ink tabular-nums">
              {formatDuration(timeSec)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 rounded-2 bg-ok-soft px-3 py-3">
            <dt className="text-xs text-ok-ink uppercase tracking-wide">
              Step OK
            </dt>
            <dd className="text-lg font-semibold text-ok-ink tabular-nums">
              {okCount}
            </dd>
          </div>
          <div className="flex flex-col gap-1 rounded-2 bg-bad-soft px-3 py-3">
            <dt className="text-xs text-bad-ink uppercase tracking-wide">
              Step NOK
            </dt>
            <dd className="text-lg font-semibold text-bad-ink tabular-nums">
              {nokCount}
            </dd>
          </div>
        </dl>

        <Button
          size="hmi"
          className="w-full"
          onClick={() => router.replace('/dashboard')}
        >
          Torna al dashboard
        </Button>
      </div>
    </div>
  )
}
