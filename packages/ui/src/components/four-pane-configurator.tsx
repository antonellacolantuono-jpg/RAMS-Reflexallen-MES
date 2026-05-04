'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Tabs } from './Tabs'

// PROMPT_15 — Universal 4-Pane Configurator (MASTER_SPEC § 14.4).
// Strategy 2: this is the primitive shell; consumers (StepConfiguratorPane,
// future Workflow / BOM / Recipe configurators) wire wizard + palette +
// config + preview adapters. See TODO-074 for universal rollout.
//
// Layout (per § 14.4 visual budget):
//   xl ≥1280px : 4 columns | wizard ~180 | palette ~280 | config flex | preview ~340 |
//   md/lg     : 3 columns | wizard ~180 | palette ~280 | config flex | preview drawer toggle |
//   sm <1024  : stacked tabs (Wizard / Palette / Config / Preview)

export interface FourPaneWizardStep {
  id: string
  label: string
  complete: boolean
  error?: string | undefined
  optional?: boolean | undefined
}

export interface FourPanePaletteAdapter<TResource> {
  title: string
  items: TResource[]
  /** Visual rendering for one resource row. The framework renders the wrapping <li>. */
  renderItem: (resource: TResource) => React.ReactNode
  onSelect: (resource: TResource) => void
  selectedId?: string | null | undefined
  emptyHint?: string | undefined
  /** Optional contextual filters (chips above the list). */
  filters?: Array<{ label: string; value: string }> | undefined
  filterValue?: string | undefined
  onFilterChange?: ((value: string) => void) | undefined
  searchPlaceholder?: string | undefined
  searchValue?: string | undefined
  onSearchChange?: ((value: string) => void) | undefined
}

export interface FourPaneConfiguratorProps<TResource> {
  /** Title displayed in the toolbar. */
  title: string
  /** Optional subtitle / breadcrumb under the title. */
  subtitle?: string | undefined
  wizardSteps: FourPaneWizardStep[]
  currentWizardStep: string
  onWizardStepChange: (step: string) => void
  paletteAdapter: FourPanePaletteAdapter<TResource>
  configCenter: { title: string; children: React.ReactNode }
  livePreview: { title: string; children: React.ReactNode }
  onCancel: () => void
  onSave: () => void | Promise<void>
  saving?: boolean | undefined
  saveDisabled?: boolean | undefined
  saveLabel?: string | undefined
  cancelLabel?: string | undefined
  /** Test id forwarded to the root container. */
  testId?: string | undefined
}

function useViewportSize(): 'sm' | 'md' | 'xl' {
  const [size, setSize] = React.useState<'sm' | 'md' | 'xl'>('xl')
  React.useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      if (w >= 1280) setSize('xl')
      else if (w >= 1024) setSize('md')
      else setSize('sm')
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])
  return size
}

export function FourPaneConfigurator<TResource>({
  title,
  subtitle,
  wizardSteps,
  currentWizardStep,
  onWizardStepChange,
  paletteAdapter,
  configCenter,
  livePreview,
  onCancel,
  onSave,
  saving = false,
  saveDisabled = false,
  saveLabel = 'Salva',
  cancelLabel = 'Annulla',
  testId,
}: FourPaneConfiguratorProps<TResource>) {
  const size = useViewportSize()
  const [previewOpen, setPreviewOpen] = React.useState(true)

  const wizardPane = (
    <WizardPane
      steps={wizardSteps}
      current={currentWizardStep}
      onChange={onWizardStepChange}
    />
  )
  const palettePane = <PalettePane adapter={paletteAdapter} />
  const configPane = (
    <ConfigPane title={configCenter.title}>{configCenter.children}</ConfigPane>
  )
  const previewPane = (
    <PreviewPane title={livePreview.title}>{livePreview.children}</PreviewPane>
  )

  return (
    <div
      className="flex flex-col h-full bg-neutral-50"
      data-testid={testId ?? 'four-pane-configurator'}
      data-viewport={size}
    >
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-neutral-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {size === 'md' && (
            <button
              type="button"
              onClick={() => setPreviewOpen((s) => !s)}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              data-testid="four-pane-preview-toggle"
            >
              {previewOpen ? 'Nascondi anteprima' : 'Mostra anteprima'}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-200 px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            data-testid="four-pane-cancel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving || saveDisabled}
            className="rounded-md bg-primary-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            data-testid="four-pane-save"
          >
            {saving ? 'Salvataggio…' : saveLabel}
          </button>
        </div>
      </header>

      {/* Body */}
      {size === 'sm' ? (
        <StackedLayout
          wizardSteps={wizardSteps}
          currentWizardStep={currentWizardStep}
          wizardPane={wizardPane}
          palettePane={palettePane}
          configPane={configPane}
          previewPane={previewPane}
        />
      ) : (
        <div className="flex flex-1 min-h-0">
          <aside
            className="w-[180px] shrink-0 border-r border-neutral-200 bg-white overflow-y-auto"
            data-testid="four-pane-wizard"
          >
            {wizardPane}
          </aside>
          <aside
            className="w-[280px] shrink-0 border-r border-neutral-200 bg-white overflow-y-auto"
            data-testid="four-pane-palette"
          >
            {palettePane}
          </aside>
          <main
            className="flex-1 min-w-0 overflow-y-auto bg-white"
            data-testid="four-pane-config"
          >
            {configPane}
          </main>
          {(size === 'xl' || (size === 'md' && previewOpen)) && (
            <aside
              className={cn(
                'w-[340px] shrink-0 border-l border-neutral-200 bg-neutral-50 overflow-y-auto',
                size === 'md' && 'absolute right-0 top-[57px] bottom-0 z-10 shadow-lg bg-white',
              )}
              data-testid="four-pane-preview"
            >
              {previewPane}
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

function WizardPane({
  steps,
  current,
  onChange,
}: {
  steps: FourPaneWizardStep[]
  current: string
  onChange: (id: string) => void
}) {
  return (
    <ol className="p-3 space-y-1">
      {steps.map((step, idx) => {
        const isActive = step.id === current
        const tone = step.error
          ? 'text-rose-700'
          : step.complete
            ? 'text-emerald-700'
            : 'text-neutral-600'
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onChange(step.id)}
              data-testid={`four-pane-wizard-step-${step.id}`}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-2 rounded text-left text-sm transition-colors',
                isActive ? 'bg-primary-50 font-medium' : 'hover:bg-neutral-50',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold shrink-0',
                  step.error
                    ? 'bg-rose-100 text-rose-700'
                    : step.complete
                      ? 'bg-emerald-100 text-emerald-700'
                      : isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-500',
                )}
              >
                {step.complete ? '✓' : idx + 1}
              </span>
              <span className={cn('flex-1 truncate', tone)}>
                {step.label}
                {step.optional && (
                  <span className="text-[10px] text-neutral-400 ml-1">(opzionale)</span>
                )}
              </span>
            </button>
            {step.error && isActive && (
              <p className="ml-8 text-[11px] text-rose-600">{step.error}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function PalettePane<TResource>({ adapter }: { adapter: FourPanePaletteAdapter<TResource> }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-neutral-100 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {adapter.title}
        </h2>
        {adapter.searchPlaceholder !== undefined && (
          <input
            type="text"
            value={adapter.searchValue ?? ''}
            onChange={(e) => adapter.onSearchChange?.(e.target.value)}
            placeholder={adapter.searchPlaceholder}
            data-testid="four-pane-palette-search"
            className="mt-2 w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
          />
        )}
        {adapter.filters && adapter.filters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {adapter.filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => adapter.onFilterChange?.(f.value)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium border',
                  adapter.filterValue === f.value
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto" data-testid="four-pane-palette-list">
        {adapter.items.length === 0 ? (
          <li className="p-4 text-sm text-neutral-500 text-center">
            {adapter.emptyHint ?? 'Nessuna risorsa disponibile.'}
          </li>
        ) : (
          adapter.items.map((item, idx) => (
            <li key={idx}>{adapter.renderItem(item)}</li>
          ))
        )}
      </ul>
    </div>
  )
}

function ConfigPane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  )
}

function PreviewPane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  )
}

function StackedLayout({
  wizardSteps,
  currentWizardStep: _currentWizardStep,
  wizardPane,
  palettePane,
  configPane,
  previewPane,
}: {
  wizardSteps: FourPaneWizardStep[]
  currentWizardStep: string
  wizardPane: React.ReactNode
  palettePane: React.ReactNode
  configPane: React.ReactNode
  previewPane: React.ReactNode
}) {
  const [active, setActive] = React.useState<'wizard' | 'palette' | 'config' | 'preview'>(
    'wizard',
  )
  const tabs = [
    {
      id: 'wizard',
      label: 'Procedura',
      count: wizardSteps.length,
    },
    { id: 'palette', label: 'Risorse' },
    { id: 'config', label: 'Configurazione' },
    { id: 'preview', label: 'Anteprima' },
  ]
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Tabs
        tabs={tabs}
        value={active}
        onChange={(id) => setActive(id as typeof active)}
        className="border-b border-neutral-200 bg-white"
      />
      <div className="flex-1 overflow-y-auto bg-white">
        {active === 'wizard' && wizardPane}
        {active === 'palette' && palettePane}
        {active === 'config' && configPane}
        {active === 'preview' && previewPane}
      </div>
    </div>
  )
}
