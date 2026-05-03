import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParallelSlotsContainer } from './ParallelSlotsContainer'
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
    stepName: 'Slot ' + (overrides.stepOrder ?? 0),
    stepCategory: 'identification',
    stepOrder: 0,
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

describe('ParallelSlotsContainer', () => {
  it('renders the counter "X/Y completati" reflecting completed slots', () => {
    render(
      <ParallelSlotsContainer
        slots={[
          step({ stepOrder: 4, status: 'done' }),
          step({ stepOrder: 5, status: 'running' }),
          step({ stepOrder: 6, status: 'pending' }),
        ]}
        deviceRunning={true}
      />,
    )
    const counter = screen.getByTestId('parallel-slots-counter')
    expect(counter).toHaveTextContent('1/3 completati')
    const root = screen.getByTestId('parallel-slots-container')
    expect(root.getAttribute('data-completed')).toBe('1')
    expect(root.getAttribute('data-total')).toBe('3')
    expect(screen.getByTestId('parallel-slot-4')).toBeInTheDocument()
    expect(screen.getByTestId('parallel-slot-5')).toBeInTheDocument()
    expect(screen.getByTestId('parallel-slot-6')).toBeInTheDocument()
  })

  it('shows X/X completati in the success-tone chip when all slots are done', () => {
    render(
      <ParallelSlotsContainer
        slots={[
          step({ stepOrder: 4, status: 'done' }),
          step({ stepOrder: 5, status: 'done' }),
          step({ stepOrder: 6, status: 'skipped' }),
        ]}
        deviceRunning={false}
      />,
    )
    const counter = screen.getByTestId('parallel-slots-counter')
    expect(counter).toHaveTextContent('3/3 completati')
    expect(counter.className).toContain('bg-ok-soft')
  })
})
