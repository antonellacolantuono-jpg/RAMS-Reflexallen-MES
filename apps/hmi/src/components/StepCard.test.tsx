import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepCard } from './StepCard'
import type { WorkOrderStep } from '../lib/queries'

function makeStep(overrides: Partial<WorkOrderStep> = {}): WorkOrderStep {
  return {
    stepExecutionId: 'se-1',
    workOrderId: 'wo-1',
    stepId: 'step-1',
    status: 'running',
    result: null,
    durationSec: 42,
    startedAt: '2026-05-03T10:00:00.000Z',
    completedAt: null,
    stepName: 'Apply identification label',
    stepCategory: 'identification',
    stepOrder: 2,
    actionType: 'apply_label',
    instructions: 'Posiziona etichetta sul lato A',
    deviceCategory: null,
    deviceSerialNumber: null,
    groupId: 'g-1',
    groupName: 'Identification',
    groupCategory: 'identification',
    groupSupportsParallel: false,
    recoveryStage: null,
    attemptCount: 0,
    data: null,
    ...overrides,
  }
}

describe('StepCard — baseline', () => {
  it('renders step name and the top-level actionType in the metadata grid', () => {
    render(<StepCard step={makeStep()} index={1} totalSteps={5} />)
    expect(screen.getByText('Apply identification label')).toBeDefined()
    expect(screen.getByText('apply_label')).toBeDefined()
  })
})

describe('StepCard — step.data overrides (PROMPT_7 D4)', () => {
  it('shows reference photo when step.data.photoUrl is set', () => {
    const photo = 'data:image/png;base64,iVBORw0KGgo='
    render(
      <StepCard
        step={makeStep({ data: { photoUrl: photo } })}
        index={1}
        totalSteps={5}
      />,
    )
    const figure = screen.getByTestId('step-card-photo')
    expect(figure).toBeDefined()
    const img = figure.querySelector('img')
    expect(img?.getAttribute('src')).toBe(photo)
    expect(img?.getAttribute('alt')).toBe('Foto di riferimento')
  })

  it('does not render the photo block when step.data.photoUrl is absent', () => {
    render(<StepCard step={makeStep()} index={1} totalSteps={5} />)
    expect(screen.queryByTestId('step-card-photo')).toBeNull()
  })

  it('prefers step.data.actionType over the top-level actionType for the badge', () => {
    render(
      <StepCard
        step={makeStep({
          actionType: 'apply_label',
          data: { actionType: 'visual_check' },
        })}
        index={1}
        totalSteps={5}
      />,
    )
    expect(screen.getByText('visual_check')).toBeDefined()
    expect(screen.queryByText('apply_label')).toBeNull()
  })
})

describe('StepCard — Postazione (PROMPT_15)', () => {
  it('renders the Postazione chip when step.workUnit is set', () => {
    render(
      <StepCard
        step={makeStep({
          workUnitId: 'wu-1',
          workUnit: { id: 'wu-1', code: 'WS-LEAK-01', name: 'Postazione Leak 1' },
        })}
        index={1}
        totalSteps={5}
      />,
    )
    const chip = screen.getByTestId('step-card-postazione')
    expect(chip.textContent).toContain('WS-LEAK-01')
    expect(chip.textContent).toContain('Postazione')
  })

  it('does not render the Postazione chip when step.workUnit is null', () => {
    render(<StepCard step={makeStep({ workUnit: null })} index={1} totalSteps={5} />)
    expect(screen.queryByTestId('step-card-postazione')).toBeNull()
  })
})
