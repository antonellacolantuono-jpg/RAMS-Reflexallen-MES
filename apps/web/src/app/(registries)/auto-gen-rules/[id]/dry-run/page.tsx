'use client'

import { useState, useMemo, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Field, Input, PageHeader, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'

type RuleModel = { id: string; name: string; trigger: string; scope: string; description: string }

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'date' | 'number'
  placeholder?: string
}

const FIELDS_BY_RULE: Record<string, FieldDef[]> = {
  '1': [
    { key: 'plantId', label: 'Plant ID', type: 'text', placeholder: 'es: cuid del plant' },
    { key: 'itemId', label: 'Item ID', type: 'text', placeholder: 'es: cuid dell’item' },
    { key: 'year', label: 'Anno', type: 'number', placeholder: '2026' },
  ],
  '2': [
    { key: 'plantId', label: 'Plant ID', type: 'text' },
    { key: 'releasedAt', label: 'Data rilascio', type: 'date' },
  ],
  '3': [
    { key: 'plantId', label: 'Plant ID', type: 'text' },
    { key: 'boxTypeId', label: 'BoxType ID', type: 'text' },
  ],
  '4': [
    { key: 'plantId', label: 'Plant ID', type: 'text' },
    { key: 'equipmentNodeId', label: 'EquipmentNode ID', type: 'text' },
  ],
  '5': [{ key: 'recipeId', label: 'Recipe ID', type: 'text' }],
  '6': [
    { key: 'workOrderId', label: 'WorkOrder ID', type: 'text' },
    { key: 'stepId', label: 'Step ID (opzionale)', type: 'text' },
  ],
  '7': [
    { key: 'plantId', label: 'Plant ID', type: 'text' },
    { key: 'equipmentNodeId', label: 'EquipmentNode ID', type: 'text' },
    { key: 'occurredAt', label: 'Data evento', type: 'date' },
  ],
}

function buildPayload(
  rid: string,
  values: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const f of FIELDS_BY_RULE[rid] ?? []) {
    const v = values[f.key]
    if (v === undefined || v === '') {
      // Skip optional empties (e.g. stepId for rule 6)
      continue
    }
    if (f.type === 'number') {
      payload[f.key] = Number(v)
    } else if (f.type === 'date') {
      payload[f.key] = new Date(v).toISOString()
    } else {
      payload[f.key] = v
    }
  }
  return payload
}

export default function DryRunRulePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const ruleId = params?.id ?? ''
  const [values, setValues] = useState<Record<string, string>>({})

  const { data: rules, isLoading } = useQuery({
    queryKey: ['auto-gen-rules'],
    queryFn: () => sdk.autoGenRules.list(),
  })

  const rule = useMemo<RuleModel | null>(
    () => (rules ?? []).find((r) => r.id === ruleId) ?? null,
    [rules, ruleId],
  )

  const fields = FIELDS_BY_RULE[ruleId] ?? []

  const mutation = useMutation({
    mutationFn: () => sdk.autoGenRules.dryRun(ruleId, buildPayload(ruleId, values)),
  })

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutation.mutate()
  }

  const setValue = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!rule) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <PageHeader title="Regola non trovata" />
        <Button variant="ghost" onClick={() => router.push('/auto-gen-rules')}>
          ← Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto max-w-2xl">
      <PageHeader
        title={`Prova regola: ${rule.name}`}
        subtitle="Anteprima — non salva nel DB"
        actions={
          <Link
            href="/auto-gen-rules"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            ← Indietro
          </Link>
        }
      />

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
        {rule.description}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5">
        {fields.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nessun parametro richiesto per questa regola.
          </p>
        )}
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              type={f.type === 'date' ? 'datetime-local' : f.type}
              value={values[f.key] ?? ''}
              onChange={(e) => setValue(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          </Field>
        ))}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Generazione...' : 'Genera codice'}
          </Button>
        </div>
      </form>

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Errore:</strong>{' '}
          {(mutation.error as Error)?.message ?? 'Errore sconosciuto'}
        </div>
      )}

      {mutation.isSuccess && mutation.data && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="text-xs uppercase tracking-wide text-emerald-700">
            Codice generato
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-emerald-900 break-all">
            {mutation.data.code}
          </div>
          <details className="mt-3 text-xs text-emerald-700">
            <summary className="cursor-pointer">Contesto echo</summary>
            <pre className="mt-2 overflow-x-auto bg-white p-2 rounded border border-emerald-200 text-neutral-700">
              {JSON.stringify(mutation.data.contextEcho, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
