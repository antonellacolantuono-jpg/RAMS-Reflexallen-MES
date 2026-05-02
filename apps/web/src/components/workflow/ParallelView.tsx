'use client'

import {
  selectParallelGroups,
  groupParallelChildren,
  type ParallelViewPhase,
  type ParallelViewGroup,
  type ParallelViewStep,
} from '@mes/domain'
import { EmptyState } from '@mes/ui'
import { useWorkflowStore } from './store'

function buildParallelViewPhases(
  nodes: ReturnType<typeof useWorkflowStore.getState>['nodes'],
): ParallelViewPhase[] {
  const phaseNodes = nodes
    .filter((n) => n.type === 'phaseNode')
    .sort(
      (a, b) =>
        ((a.data['order'] as number) ?? 0) - ((b.data['order'] as number) ?? 0),
    )
  return phaseNodes.map((phase) => ({
    id: phase.id,
    name: (phase.data['label'] as string) ?? phase.id,
    groups: nodes
      .filter((n) => n.type === 'groupNode' && n.data['parentId'] === phase.id)
      .sort(
        (a, b) =>
          ((a.data['order'] as number) ?? 0) - ((b.data['order'] as number) ?? 0),
      )
      .map<ParallelViewGroup>((group) => ({
        id: group.id,
        name: (group.data['label'] as string) ?? group.id,
        category: (group.data['category'] as string) ?? '',
        supportsParallel: group.data['supportsParallel'] === true,
        steps: nodes
          .filter(
            (n) => n.type === 'stepNode' && n.data['parentId'] === group.id,
          )
          .map<ParallelViewStep>((step) => ({
            id: step.id,
            name: (step.data['label'] as string) ?? step.id,
            order: (step.data['order'] as number) ?? 0,
            deviceCategory:
              (step.data['deviceCategory'] as
                | 'pre'
                | 'device_main'
                | 'parallel'
                | 'post'
                | null
                | undefined) ?? null,
          })),
      })),
  }))
}

function StepCard({
  step,
  tone,
}: {
  step: ParallelViewStep
  tone: 'main' | 'parallel' | 'pre' | 'post'
}) {
  const toneClass =
    tone === 'main'
      ? 'border-accent bg-accent-soft text-accent-ink'
      : tone === 'parallel'
        ? 'border-info-soft bg-info-soft/40 text-info-ink'
        : 'border-neutral-200 bg-white text-neutral-700'

  return (
    <div
      className={`rounded-md border ${toneClass} px-3 py-2 text-sm shadow-sm`}
      data-parallel-card={tone}
    >
      <div className="font-mono text-[10px] uppercase tracking-wide opacity-70">
        {tone === 'main' ? 'MAIN' : tone === 'parallel' ? 'PARALLEL' : tone.toUpperCase()}
      </div>
      <div className="mt-0.5 font-medium leading-tight">{step.name}</div>
      <div className="mt-0.5 text-[10px] opacity-70">
        {step.deviceCategory ?? '—'} · ord. {step.order}
      </div>
    </div>
  )
}

export function ParallelView() {
  const nodes = useWorkflowStore((s) => s.nodes)
  const selectNode = useWorkflowStore((s) => s.selectNode)

  const phases = buildParallelViewPhases(nodes)
  const parallelGroups = selectParallelGroups(phases)

  if (parallelGroups.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" data-parallel-view="empty">
        <EmptyState
          kind="no-data"
          title="Nessun gruppo Parallelo"
          body="La vista Parallel mostra i gruppi device_execution con supportsParallel attivo. Crea un gruppo device_execution e abilita il flag dal modale di creazione."
          compact
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4" data-parallel-view="grid">
      <div className="flex flex-col gap-4">
        {parallelGroups.map((group) => {
          const split = groupParallelChildren(group)
          return (
            <section
              key={group.id}
              className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
              data-parallel-group={group.id}
            >
              <header className="mb-2 flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-neutral-800">{group.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    device_execution · supportsParallel
                  </div>
                </div>
                <span className="rounded bg-info-soft px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-info-ink">
                  {split.parallelSteps.length} parallelo
                  {split.parallelSteps.length === 1 ? '' : 'i'}
                </span>
              </header>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 2fr)' }}
              >
                <div className="flex flex-col gap-2" data-pane="main">
                  {split.preSteps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => selectNode(step.id, 'stepNode')}
                      className="text-left"
                    >
                      <StepCard step={step} tone="pre" />
                    </button>
                  ))}
                  {split.mainStep ? (
                    <button
                      type="button"
                      onClick={() => selectNode(split.mainStep!.id, 'stepNode')}
                      className="text-left"
                    >
                      <StepCard step={split.mainStep} tone="main" />
                    </button>
                  ) : (
                    <div className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-400">
                      Nessuno step main rilevato
                    </div>
                  )}
                  {split.postSteps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => selectNode(step.id, 'stepNode')}
                      className="text-left"
                    >
                      <StepCard step={step} tone="post" />
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2" data-pane="parallel">
                  {split.parallelSteps.length === 0 ? (
                    <div className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-400">
                      Nessuno step parallelo
                    </div>
                  ) : (
                    split.parallelSteps.map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => selectNode(step.id, 'stepNode')}
                        className="text-left"
                      >
                        <StepCard step={step} tone="parallel" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
