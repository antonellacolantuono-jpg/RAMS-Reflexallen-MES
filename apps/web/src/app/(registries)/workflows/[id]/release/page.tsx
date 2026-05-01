'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input, Select, StatusBadge } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'

interface ReleaseResponse {
  result: {
    workOrderId: string
    workOrderCode: string
    snapshotId: string
    stepExecutionCount: number
    releasedAt: string
  }
}

interface ReleaseRequestBody {
  workflowId: string
  itemId: string
  quantity: number
  assignedOperatorId: string
  assignedShiftId?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

async function postRelease(body: ReleaseRequestBody): Promise<ReleaseResponse> {
  const res = await fetch(`${API_BASE}/api/work-orders/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { message?: string }
    const msg =
      typeof errBody.message === 'string'
        ? errBody.message
        : `${res.status} ${res.statusText}`
    throw new Error(msg)
  }
  return (await res.json()) as ReleaseResponse
}

export default function ReleaseWorkflowPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ReleaseResponse['result'] | null>(null)
  const [form, setForm] = useState({
    itemId: '',
    quantity: 10,
    assignedOperatorId: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  })

  const { data: workflow, isLoading: wfLoading } = useQuery({
    queryKey: ['workflows', id],
    queryFn: () => sdk.workflows.get(id),
  })

  const { data: itemsList } = useQuery({
    queryKey: ['items'],
    queryFn: () => sdk.items.list(),
  })
  const { data: operatorsList } = useQuery({
    queryKey: ['operators'],
    queryFn: () => sdk.operators.list(),
  })

  const versionStatus = workflow?.currentVersion?.status ?? null
  const isReleaseable = versionStatus === 'approved'

  const mutation = useMutation({
    mutationFn: (body: ReleaseRequestBody) => postRelease(body),
    onSuccess: (data) => {
      setSubmitError(null)
      setSuccess(data.result)
      void qc.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : 'Errore durante il rilascio'
      setSubmitError(msg)
    },
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSubmitError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isReleaseable) return
    mutation.mutate({
      workflowId: id,
      itemId: form.itemId,
      quantity: form.quantity,
      assignedOperatorId: form.assignedOperatorId,
      priority: form.priority,
    })
  }

  if (wfLoading) {
    return (
      <div className="p-6 max-w-2xl text-sm text-neutral-500">Caricamento…</div>
    )
  }
  if (!workflow) {
    return (
      <div className="p-6 max-w-2xl text-sm text-neutral-500">
        Flusso non trovato.
        <button
          type="button"
          className="ml-2 underline text-primary-600"
          onClick={() => router.push('/workflows')}
        >
          Torna alla lista
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="p-6 max-w-2xl">
        <PageHeader
          title="Ordine di lavoro rilasciato"
          subtitle={`Codice: ${success.workOrderCode}`}
        />
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div>
            <strong>Snapshot creato:</strong> {success.snapshotId}
          </div>
          <div>
            <strong>Step istanziati:</strong> {success.stepExecutionCount}
          </div>
          <div>
            <strong>Rilasciato il:</strong>{' '}
            {new Date(success.releasedAt).toLocaleString('it-IT')}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
            onClick={() => router.push(`/workflows/${id}`)}
          >
            Torna al flusso
          </button>
          <button
            type="button"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            onClick={() => {
              setSuccess(null)
              setForm((prev) => ({ ...prev, quantity: 10 }))
            }}
          >
            Rilascia un altro WO
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title={`Rilascia WO: ${workflow.code}`}
        subtitle={
          workflow.currentVersion
            ? `${workflow.name} — v${workflow.currentVersion.version}`
            : workflow.name
        }
      />

      {versionStatus && (
        <div className="mt-2">
          <StatusBadge
            tone={
              versionStatus === 'approved'
                ? 'ok'
                : versionStatus === 'deprecated'
                  ? 'warn'
                  : 'neutral'
            }
          >
            {versionStatus}
          </StatusBadge>
        </div>
      )}

      {!isReleaseable && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Approva il workflow prima di rilasciare un ordine di lavoro. Lo stato
          della versione corrente è <strong>{versionStatus ?? 'sconosciuto'}</strong>.
        </div>
      )}

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/workflows/${id}`)}
        isSubmitting={mutation.isPending}
        isDirty={
          form.itemId.length > 0 ||
          form.assignedOperatorId.length > 0 ||
          form.quantity !== 10
        }
        submitLabel="Rilascia"
        submittingLabel="Rilascio in corso…"
      >
        <Field label="Articolo (FG)" required>
          <Select
            value={form.itemId}
            onChange={(e) => set('itemId', e.target.value)}
            disabled={!isReleaseable}
            placeholder="Seleziona un articolo…"
            options={(itemsList?.data ?? [])
              .filter((it) => it.itemType === 'finished_good')
              .map((it) => ({ value: it.id, label: `${it.code} — ${it.name}` }))}
          />
        </Field>

        <Field label="Quantità" required>
          <Input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => set('quantity', Math.max(1, Number(e.target.value) || 0))}
            disabled={!isReleaseable}
          />
        </Field>

        <Field label="Operatore assegnato" required>
          <Select
            value={form.assignedOperatorId}
            onChange={(e) => set('assignedOperatorId', e.target.value)}
            disabled={!isReleaseable}
            placeholder="Seleziona un operatore…"
            options={(operatorsList?.data ?? [])
              .filter((op) => op.status === 'active')
              .map((op) => ({
                value: op.id,
                label: `${op.badge} — ${op.firstName} ${op.lastName}`,
              }))}
          />
        </Field>

        <Field label="Priorità">
          <Select
            value={form.priority}
            onChange={(e) =>
              set('priority', e.target.value as typeof form.priority)
            }
            disabled={!isReleaseable}
            options={[
              { value: 'low', label: 'Bassa' },
              { value: 'normal', label: 'Normale' },
              { value: 'high', label: 'Alta' },
              { value: 'urgent', label: 'Urgente' },
            ]}
          />
        </Field>

        {submitError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {submitError}
          </div>
        )}
      </EntityForm>
    </div>
  )
}
