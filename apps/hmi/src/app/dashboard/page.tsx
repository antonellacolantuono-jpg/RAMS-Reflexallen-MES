'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { HMIBigBtn, HMIShell } from '@mes/ui'
import {
  useLogout,
  useMe,
  useMyWorkOrders,
  useWoAssignedSubscription,
} from '../../lib/queries'
import { ApiError } from '../../lib/api-client'
import { useOperatorStore } from '../../lib/operator-store'
import { WorkOrderCard } from '../../components/WorkOrderCard'

export default function DashboardPage() {
  const router = useRouter()
  const me = useMe()
  const workOrders = useMyWorkOrders({ enabled: !!me.data })
  const logout = useLogout()
  const setStoredOperator = useOperatorStore((s) => s.setOperator)

  const isUnauthorized =
    me.error instanceof ApiError && me.error.status === 401

  React.useEffect(() => {
    if (isUnauthorized) {
      router.replace('/')
    }
  }, [isUnauthorized, router])

  React.useEffect(() => {
    if (me.data) setStoredOperator(me.data)
  }, [me.data, setStoredOperator])

  // D6: live update — invalidate `my-work-orders` when API emits `wo:assigned`
  // for this operator. Without this, a manager-released WO would only appear
  // after a manual refresh.
  useWoAssignedSubscription(me.data?.id)

  if (me.isLoading || !me.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <HMIShell title="Caricamento…">
          <p className="text-ink-3 text-center mt-12">Caricamento…</p>
        </HMIShell>
      </div>
    )
  }

  const operator = me.data
  const woList = workOrders.data ?? []
  const shiftCode = woList[0]?.shiftCode ?? null
  const hasQc = (operator.skillCodes ?? []).includes('QC')

  async function handleLogout() {
    try {
      await logout.mutateAsync()
    } catch {
      // Even if the call fails, navigate away — the cookie may already be cleared.
    }
    setStoredOperator(null)
    router.replace('/')
  }

  function handleOpen(id: string) {
    router.push(`/wo/${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HMIShell
        title="Ordini di lavoro"
        sub={`${operator.firstName} ${operator.lastName}${shiftCode ? ` · Turno ${shiftCode}` : ''} · Badge ${operator.badge}`}
        headerRight={
          hasQc ? (
            <HMIBigBtn
              variant="primary"
              onClick={() => router.push('/qc-review')}
            >
              Revisione QC
            </HMIBigBtn>
          ) : undefined
        }
        footer={
          <HMIBigBtn
            variant="default"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            Esci
          </HMIBigBtn>
        }
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <span className="uppercase-label">Assegnati al tuo badge</span>
            <span className="text-sm text-ink-3 tabular-nums">
              {woList.length} {woList.length === 1 ? 'ordine' : 'ordini'}
            </span>
          </div>

          {workOrders.isLoading ? (
            <div className="glass rounded-3 p-12 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-ink-3">Caricamento ordini…</p>
            </div>
          ) : workOrders.isError ? (
            <div className="glass rounded-3 p-12 flex flex-col items-center gap-3 text-center">
              <span className="text-4xl">⚠️</span>
              <h2 className="text-lg font-semibold text-ink">
                Impossibile caricare gli ordini
              </h2>
              <p className="text-sm text-ink-3 max-w-sm">
                Verificare la connessione di rete e riprovare.
              </p>
            </div>
          ) : woList.length === 0 ? (
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
              {woList.map((wo) => (
                <WorkOrderCard
                  key={wo.id}
                  workOrder={{
                    id: wo.id,
                    code: wo.code,
                    itemCode: wo.itemCode,
                    itemName: wo.itemName,
                    quantity: wo.quantity,
                    completed: wo.completed,
                    assignedTo: operator.badge,
                    priority: wo.priority,
                    status: wo.status,
                    startedAt: wo.startedAt,
                  }}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          )}
        </div>
      </HMIShell>
    </div>
  )
}
