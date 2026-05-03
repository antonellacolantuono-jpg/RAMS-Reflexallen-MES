import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepGeneric } from './StepGeneric'
import type { WorkOrderStep } from '../../../lib/queries'

// Stub out the WS singleton + polling fetch so DeviceCycleView mounts cleanly
// in jsdom — these are exercised by their own test files.
vi.mock('../../../lib/socket', () => ({
  getSocket: () => ({
    on: () => {},
    off: () => {},
    emit: () => {},
  }),
  disconnectSocket: () => {},
}))

const baseStep: WorkOrderStep = {
  stepExecutionId: 'se-1',
  workOrderId: 'wo-1',
  stepId: 'step-1',
  status: 'running',
  result: null,
  durationSec: null,
  startedAt: null,
  completedAt: null,
  stepName: 'Applica etichetta sul tubo',
  stepCategory: 'identification',
  stepOrder: 1,
  actionType: 'apply_label',
  instructions: null,
  deviceCategory: null,
  deviceSerialNumber: null,
  groupId: 'g-1',
  groupName: 'Identificazione',
  groupCategory: 'identification',
  groupSupportsParallel: false,
  recoveryStage: null,
  attemptCount: 0,
}

describe('StepGeneric', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders title, description, resource chips and action button for a non-device step', () => {
    const onComplete = vi.fn()
    render(
      <StepGeneric
        step={baseStep}
        description="Applicare l'etichetta LBL-PNE-001 sul pezzo."
        resources={[
          { kind: 'material', code: 'LBL-PNE-001', label: 'Etichetta lotto' },
          { kind: 'tool', code: 'TLK-001', label: 'Stampante' },
        ]}
        onComplete={onComplete}
      />,
    )

    expect(screen.getByTestId('step-generic-title')).toHaveTextContent(
      'Applica etichetta sul tubo',
    )
    expect(screen.getByTestId('step-generic-description')).toHaveTextContent(
      'LBL-PNE-001',
    )
    const chips = screen.getByTestId('step-generic-resources')
    expect(chips).toHaveTextContent('LBL-PNE-001')
    expect(chips).toHaveTextContent('TLK-001')

    // No DeviceCycleView for non-device steps.
    expect(screen.queryByTestId('device-cycle-view')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Completa' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('delegates to DeviceCycleView for device_main + device_run steps with a known serial', () => {
    const deviceStep: WorkOrderStep = {
      ...baseStep,
      stepName: 'Test di tenuta',
      stepCategory: 'production',
      actionType: 'device_run',
      deviceCategory: 'device_main',
      deviceSerialNumber: 'DEV-LEAK-001',
    }
    render(<StepGeneric step={deviceStep} />)
    const cycleView = screen.getByTestId('device-cycle-view')
    expect(cycleView).toBeInTheDocument()
    expect(cycleView.getAttribute('data-device-serial')).toBe('DEV-LEAK-001')
    // Leak telemetry mounts under DeviceCycleView for the leak device.
    expect(screen.getByTestId('leak-telemetry')).toBeInTheDocument()
  })
})
