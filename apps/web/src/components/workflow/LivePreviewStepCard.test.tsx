import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LivePreviewStepCard } from './LivePreviewStepCard'
import type { PreviewStepData, PreviewRuntimeFields } from './livePreview/mockData'
import type { PreviewState } from './livePreview/states'

function makeStep(overrides: Partial<PreviewStepData> = {}): PreviewStepData {
  return {
    id: 'step-1',
    name: 'Verifica visiva pezzo',
    category: 'quality_control',
    actionType: 'visual_check',
    instructions: 'Controllare la finitura della superficie A.',
    deviceCategory: null,
    deviceSerialNumber: null,
    photoUrl: null,
    ...overrides,
  }
}

const RUNTIME_IDLE: PreviewRuntimeFields = {
  durationSec: null,
  attemptCount: 0,
  blockedNote: null,
}

function rt(overrides: Partial<PreviewRuntimeFields> = {}): PreviewRuntimeFields {
  return { ...RUNTIME_IDLE, ...overrides }
}

describe('LivePreviewStepCard — baseline', () => {
  it('renders the step name and the Italian category label', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="idle"
        runtime={RUNTIME_IDLE}
      />,
    )
    expect(screen.getByText('Verifica visiva pezzo')).toBeDefined()
    expect(screen.getByText('Controllo Qualità')).toBeDefined()
  })

  it('exposes the preview state and mapped HMI status as data attributes', () => {
    const { container } = render(
      <LivePreviewStepCard
        step={makeStep()}
        state="in_progress"
        runtime={rt({ durationSec: 42 })}
      />,
    )
    const card = container.querySelector('[data-testid="live-preview-step-card"]')
    expect(card?.getAttribute('data-state')).toBe('in_progress')
    expect(card?.getAttribute('data-status')).toBe('running')
  })
})

describe('LivePreviewStepCard — state-driven visuals', () => {
  it('shows duration and action when running (in_progress)', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="in_progress"
        runtime={rt({ durationSec: 95 })}
      />,
    )
    expect(screen.getByText('1m 35s')).toBeDefined()
    expect(screen.getByText('visual_check')).toBeDefined()
    expect(
      screen.getByText('Controllare la finitura della superficie A.'),
    ).toBeDefined()
  })

  it('shows the blocked note callout when failed', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="failed"
        runtime={rt({ blockedNote: 'Pezzo fuori tolleranza.' })}
      />,
    )
    expect(screen.getByText('Pezzo fuori tolleranza.')).toBeDefined()
  })

  it('shows a QC-hold callout for warning state', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="warning"
        runtime={rt({ blockedNote: 'Soglia di attenzione superata.' })}
      />,
    )
    expect(screen.getByText('Soglia di attenzione superata.')).toBeDefined()
  })

  it('shows the recovered callout for retry state', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="retry"
        runtime={rt({ attemptCount: 2, durationSec: 30 })}
      />,
    )
    expect(
      screen.getByText('Step recuperato — pronto per riprendere o concludere.'),
    ).toBeDefined()
  })

  it('shows the error callout with custom note for error state', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="error"
        runtime={rt({ blockedNote: 'Errore di esecuzione — reset richiesto.' })}
      />,
    )
    expect(
      screen.getByText('Errore di esecuzione — reset richiesto.'),
    ).toBeDefined()
  })

  it('renders the reference photo when photoUrl is set', () => {
    const photo = 'data:image/png;base64,AAAA'
    render(
      <LivePreviewStepCard
        step={makeStep({ photoUrl: photo })}
        state="in_progress"
        runtime={rt({ durationSec: 10 })}
      />,
    )
    const figure = screen.getByTestId('live-preview-photo')
    expect(figure).toBeDefined()
    const img = figure.querySelector('img')
    expect(img?.getAttribute('src')).toBe(photo)
  })

  it('does not render the photo block when photoUrl is absent', () => {
    render(
      <LivePreviewStepCard
        step={makeStep()}
        state="in_progress"
        runtime={rt({ durationSec: 10 })}
      />,
    )
    expect(screen.queryByTestId('live-preview-photo')).toBeNull()
  })
})

describe('LivePreviewStepCard — mirror parity with HMI StepCard', () => {
  // Each preview state maps to a known HMI status. If the HMI StepCard
  // visual contract changes, this table is the canary.
  const cases: { state: PreviewState; status: string }[] = [
    { state: 'idle', status: 'pending' },
    { state: 'ready', status: 'pending' },
    { state: 'in_progress', status: 'running' },
    { state: 'paused', status: 'paused' },
    { state: 'complete', status: 'done' },
    { state: 'retry', status: 'recovered' },
    { state: 'error', status: 'error' },
    { state: 'failed', status: 'scrapped' },
    { state: 'warning', status: 'qc_hold' },
    { state: 'timeout', status: 'blocked' },
    { state: 'offline', status: 'cancelled' },
  ]

  for (const { state, status } of cases) {
    it(`maps preview "${state}" → HMI status "${status}"`, () => {
      const { container } = render(
        <LivePreviewStepCard
          step={makeStep()}
          state={state}
          runtime={rt({
            blockedNote:
              status === 'blocked' || status === 'cancelled'
                ? 'mock note'
                : null,
          })}
        />,
      )
      const card = container.querySelector(
        '[data-testid="live-preview-step-card"]',
      )
      expect(card?.getAttribute('data-status')).toBe(status)
    })
  }
})
