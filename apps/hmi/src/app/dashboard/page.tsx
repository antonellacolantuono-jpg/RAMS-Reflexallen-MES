'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@mes/ui'
import { useOperatorStore } from '../../lib/operator-store'
import { getWorkOrdersForOperator } from '../../lib/mock-data'
import { WorkOrderCard } from '../../components/WorkOrderCard'

export default function DashboardPage() {
  const router = useRouter()
  const operator = useOperatorStore((s) => s.operator)
  const logout = useOperatorStore((s) => s.logout)
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

  const workOrders = getWorkOrdersForOperator(operator.badge)

  function handleLogout() {
    logout()
    router.replace('/')
  }

  function handleOpen(id: string) {
    router.push(`/wo/${id}`)
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/brand/logo-light.svg"
              alt="Reflexallen"
              className="h-7"
            />
            <div className="flex flex-col">
              <span className="text-xs text-ink-3 uppercase tracking-wide">
                Bentornato
              </span>
              <span className="text-base font-semibold text-ink">
                {operator.firstName} {operator.lastName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs text-ink-3 uppercase tracking-wide">
                Turno
              </span>
              <span className="text-sm font-medium text-ink">
                {operator.currentShift} · Badge {operator.badge}
              </span>
            </div>
            <Button size="hmi" variant="secondary" onClick={handleLogout}>
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold text-ink">
            Ordini di lavoro assegnati
          </h1>
          <span className="text-sm text-ink-3 tabular-nums">
            {workOrders.length}{' '}
            {workOrders.length === 1 ? 'ordine' : 'ordini'}
          </span>
        </div>

        {workOrders.length === 0 ? (
          <div className="glass rounded-3 p-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">📋</span>
            <h2 className="text-lg font-semibold text-ink">
              Nessun ordine assegnato
            </h2>
            <p className="text-sm text-ink-3 max-w-sm">
              Al momento non risultano ordini di lavoro assegnati al tuo
              badge. Rivolgiti al responsabile di linea.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workOrders.map((wo) => (
              <WorkOrderCard
                key={wo.id}
                workOrder={wo}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
