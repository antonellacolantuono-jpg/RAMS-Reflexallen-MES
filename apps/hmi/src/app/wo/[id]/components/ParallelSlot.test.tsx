import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParallelSlot } from './ParallelSlot'
import type { WorkOrderStep } from '../../../../lib/queries'

function step(overrides: Partial<WorkOrderStep>): WorkOrderStep {
  return {
    stepExecutionId: 'se-' + (overrides.stepOrder ?? 0),
    workOrderId: 'wo-1',
    stepId: 'step-' + (overrides.stepOrder ?? 0),
    status: 'pending',
    result: null,
    durationSec: null,
    startedAt: null,
    completedAt: null,
    stepName: 'Apply label LBL-PNE-001 on previous tube',
    stepCategory: 'identification',
    stepOrder: 4,
    actionType: 'apply_label',
    instructions: null,
    deviceCategory: 'parallel',
    deviceSerialNumber: null,
    groupId: 'g-leak',
    groupName: 'Leak test',
    groupCategory: 'device_execution',
    groupSupportsParallel: true,
    recoveryStage: null,
    attemptCount: 0,
    ...overrides,
  }
}

describe('ParallelSlot', () => {
  it('disables interaction and dims the card when device is NOT running', () => {
    const onStart = vi.fn()
    render(
      <ParallelSlot
        step={step({ status: 'pending' })}
        deviceRunning={false}
        onStart={onStart}
      />,
    )
    const slot = screen.getByTestId('parallel-slot-4')
    expect(slot.getAttribute('data-interactive')).toBe('false')
    const startBtn = screen.getByTestId('parallel-slot-4-start')
    expect(startBtn).toBeDisabled()
    fireEvent.click(startBtn)
    expect(onStart).not.toHaveBeenCalled()
    expect(
      screen.getByText(/Disponibile durante il ciclo dispositivo/),
    ).toBeInTheDocument()
  })

  it('enables Esegui + Salta when device is running and slot is pending', () => {
    const onStart = vi.fn()
    const onSkip = vi.fn()
    render(
      <ParallelSlot
        step={step({ status: 'pending' })}
        deviceRunning={true}
        onStart={onStart}
        onSkip={onSkip}
      />,
    )
    expect(
      screen.getByTestId('parallel-slot-4').getAttribute('data-interactive'),
    ).toBe('true')
    fireEvent.click(screen.getByTestId('parallel-slot-4-start'))
    expect(onStart).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('parallel-slot-4-skip'))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
