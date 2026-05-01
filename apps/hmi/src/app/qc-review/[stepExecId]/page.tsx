'use client'
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge, Button, Modal } from '@mes/ui'
import {
  useApproveQc,
  useMe,
  useQcReviewList,
  useRejectQc,
} from '../../../lib/queries'
import { ApiError } from '../../../lib/api-client'

export default function QcReviewDetailPage() {
  const router = useRouter()
  const params = useParams<{ stepExecId: string }>()
  const stepExecId = params.stepExecId
  const me = useMe()
  const list = useQcReviewList({ enabled: !!me.data })
  const approve = useApproveQc()
  const reject = useRejectQc()

  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const isUnauthorized =
    me.error instanceof ApiError && me.error.status === 401

  React.useEffect(() => {
    if (isUnauthorized) {
      router.replace('/')
    }
  }, [isUnauthorized, router])

  React.useEffect(() => {
    if (!me.data) return
    if (!(me.data.skillCodes ?? []).includes('QC')) {
      router.replace('/dashboard')
    }
  }, [me.data, router])

  const item = React.useMemo(
    () => list.data?.find((i) => i.stepExecutionId === stepExecId),
    [list.data, stepExecId],
  )

  if (me.isLoading || !me.data || list.isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-3">Caricamento…</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg text-ink">
          Step non trovato o già processato
        </p>
        <Button
          size="hmi"
          onClick={() => router.replace('/qc-review')}
        >
          Torna alla lista
        </Button>
      </div>
    )
  }

  async function handleApprove() {
    setErrorMessage(null)
    try {
      await approve.mutateAsync(stepExecId)
      router.replace('/qc-review')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore approvazione')
    }
  }

  async function handleReject() {
    const trimmed = reason.trim()
    if (!trimmed) return
    setErrorMessage(null)
    try {
      await reject.mutateAsync({ stepExecutionId: stepExecId, reason: trimmed })
      setRejectOpen(false)
      setReason('')
      router.replace('/qc-review')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore rifiuto')
    }
  }

  const isPending = approve.isPending || reject.isPending

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button
            size="md"
            variant="ghost"
            onClick={() => router.replace('/qc-review')}
          >
            ← Lista
          </Button>
          <div className="flex flex-col">
            <span className="text-xs text-ink-3 uppercase tracking-wide">
              Revisione qualità
            </span>
            <h1 className="text-lg font-semibold text-ink">
              {item.workOrderCode}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-4">
        <section className="glass rounded-3 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="warn">In attesa QC</Badge>
            <Badge tone="info">{item.stepCategory}</Badge>
          </div>
          <h2 className="text-2xl font-semibold text-ink">{item.stepName}</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Operatore
              </dt>
              <dd className="text-ink font-medium">
                {item.operatorBadge ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Avviato
              </dt>
              <dd className="text-ink font-medium tabular-nums">
                {item.startedAt
                  ? new Date(item.startedAt).toLocaleString('it-IT')
                  : '—'}
              </dd>
            </div>
          </dl>
          {errorMessage && (
            <div className="rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
              {errorMessage}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Button
              size="hmi"
              variant="danger"
              onClick={() => setRejectOpen(true)}
              disabled={isPending}
            >
              Rifiuta
            </Button>
            <Button
              size="hmi"
              variant="primary"
              onClick={handleApprove}
              disabled={isPending}
              className="text-2xl"
            >
              Approva
            </Button>
          </div>
        </section>
      </main>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Motivo del rifiuto"
        description="Lo step verrà rimandato in stato bloccato per recupero."
        width={520}
        footer={
          <>
            <Button
              size="md"
              variant="ghost"
              onClick={() => setRejectOpen(false)}
            >
              Annulla
            </Button>
            <Button
              size="md"
              variant="danger"
              onClick={handleReject}
              disabled={isPending || reason.trim().length === 0}
            >
              Conferma rifiuto
            </Button>
          </>
        }
      >
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Indica il motivo del rifiuto…"
          className="w-full min-h-[120px] rounded-2 border border-line px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </Modal>
    </div>
  )
}
