'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader, Skeleton } from '@mes/ui'
import { sdk } from '../../../lib/sdk'

type RuleModel = { id: string; name: string; trigger: string; scope: string; description: string }

export default function AutoGenRulesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['auto-gen-rules'],
    queryFn: () => sdk.autoGenRules.list(),
  })

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <PageHeader
        title="Regole Auto-Generazione"
        subtitle="7 regole configurate dal sistema — sola lettura"
      />

      <div className="rounded-lg border border-info-200 bg-info-50 px-4 py-3 text-sm text-info-800">
        Queste regole sono configurate a livello di sistema. Usa &quot;Prova regola&quot; per
        un&apos;anteprima del codice generato — l&apos;anteprima non scrive nel database.
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data ?? []).map((rule: RuleModel) => (
            <div key={rule.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-neutral-900">{rule.name}</h3>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  {rule.scope}
                </span>
              </div>
              <p className="text-xs text-neutral-600">{rule.description}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-neutral-400">
                  Trigger: <span className="font-mono text-neutral-600">{rule.trigger}</span>
                </div>
                <Link
                  href={`/auto-gen-rules/${rule.id}/dry-run`}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition"
                >
                  Prova regola
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
