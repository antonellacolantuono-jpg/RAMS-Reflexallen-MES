import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { FourPaneConfigurator } from './four-pane-configurator'

interface SampleResource {
  id: string
  label: string
}

function renderConfigurator(
  overrides: Partial<React.ComponentProps<typeof FourPaneConfigurator<SampleResource>>> = {},
) {
  const defaults: React.ComponentProps<typeof FourPaneConfigurator<SampleResource>> = {
    title: 'New Step',
    wizardSteps: [
      { id: 'cat', label: 'Categoria', complete: true },
      { id: 'act', label: 'Azione', complete: false },
      { id: 'res', label: 'Risorsa', complete: false, optional: true },
    ],
    currentWizardStep: 'act',
    onWizardStepChange: vi.fn(),
    paletteAdapter: {
      title: 'Risorse',
      items: [{ id: 'r1', label: 'Resource A' }],
      renderItem: (r) =>
        React.createElement(
          'button',
          { type: 'button', 'data-testid': `palette-${r.id}` },
          r.label,
        ),
      onSelect: vi.fn(),
    },
    configCenter: {
      title: 'Configurazione',
      children: React.createElement('div', { 'data-testid': 'config-content' }, 'config'),
    },
    livePreview: {
      title: 'Anteprima',
      children: React.createElement('div', { 'data-testid': 'preview-content' }, 'preview'),
    },
    onCancel: vi.fn(),
    onSave: vi.fn(),
  }
  return render(<FourPaneConfigurator {...defaults} {...overrides} />)
}

describe('FourPaneConfigurator', () => {
  // jsdom defaults innerWidth to 1024 — falls into "md" viewport. Force xl
  // before the component's effect reads window.innerWidth so we can test the
  // 4-pane branch.
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 })
    window.dispatchEvent(new Event('resize'))
  })

  it('renders all 4 panes (wizard / palette / config / preview)', () => {
    renderConfigurator()
    expect(screen.getByTestId('four-pane-wizard')).toBeDefined()
    expect(screen.getByTestId('four-pane-palette')).toBeDefined()
    expect(screen.getByTestId('four-pane-config')).toBeDefined()
    expect(screen.getByTestId('four-pane-preview')).toBeDefined()
    expect(screen.getByTestId('config-content').textContent).toBe('config')
    expect(screen.getByTestId('preview-content').textContent).toBe('preview')
  })

  it('clicking a wizard step fires onWizardStepChange', () => {
    const onChange = vi.fn()
    renderConfigurator({ onWizardStepChange: onChange })
    fireEvent.click(screen.getByTestId('four-pane-wizard-step-res'))
    expect(onChange).toHaveBeenCalledWith('res')
  })

  it('renders palette items via the renderItem adapter', () => {
    renderConfigurator()
    expect(screen.getByTestId('palette-r1').textContent).toBe('Resource A')
  })

  it('renders empty palette hint when no items', () => {
    renderConfigurator({
      paletteAdapter: {
        title: 'Risorse',
        items: [],
        renderItem: () => null,
        onSelect: vi.fn(),
        emptyHint: 'Step manuale, no risorsa',
      },
    })
    expect(screen.getByText('Step manuale, no risorsa')).toBeDefined()
  })

  it('save button calls onSave; disabled while saving', () => {
    const onSave = vi.fn()
    const { rerender } = renderConfigurator({ onSave })
    fireEvent.click(screen.getByTestId('four-pane-save'))
    expect(onSave).toHaveBeenCalled()
    rerender(
      <FourPaneConfigurator
        title="New Step"
        wizardSteps={[{ id: 'cat', label: 'Categoria', complete: true }]}
        currentWizardStep="cat"
        onWizardStepChange={vi.fn()}
        paletteAdapter={{
          title: 'Risorse',
          items: [],
          renderItem: () => null,
          onSelect: vi.fn(),
        }}
        configCenter={{ title: 'Configurazione', children: null }}
        livePreview={{ title: 'Anteprima', children: null }}
        onCancel={vi.fn()}
        onSave={onSave}
        saving={true}
      />,
    )
    expect((screen.getByTestId('four-pane-save') as HTMLButtonElement).disabled).toBe(true)
  })

  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn()
    renderConfigurator({ onCancel })
    fireEvent.click(screen.getByTestId('four-pane-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('switches to stacked tabs layout when viewport is small', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 })
    window.dispatchEvent(new Event('resize'))
    renderConfigurator()
    // In stacked mode the dedicated wizard/palette/config/preview testids
    // are NOT rendered — only the active tab content is shown.
    expect(screen.queryByTestId('four-pane-wizard')).toBeNull()
    // Tabs are present
    expect(screen.getByText('Procedura')).toBeDefined()
    expect(screen.getByText('Risorse')).toBeDefined()
    expect(screen.getByText('Configurazione')).toBeDefined()
    expect(screen.getByText('Anteprima')).toBeDefined()
  })
})
