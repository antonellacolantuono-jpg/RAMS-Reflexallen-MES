import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useParams: () => ({ id: 'wo-1' }),
}))

vi.mock('../../../lib/operator-store', () => ({
  useOperatorStore: (selector: (s: { operator: { id: string; badge: string } | null }) => unknown) =>
    selector({ operator: { id: 'op-1', badge: 'OP-0142' } }),
}))

vi.mock('../../../lib/queries', () => ({
  useWorkOrderSteps: () => ({
    isLoading: false,
    error: null,
    data: [
      {
        stepExecutionId: 'se-1',
        workOrderId: 'wo-1',
        stepId: 'step-1',
        status: 'pending',
        result: null,
        durationSec: null,
        startedAt: null,
        completedAt: null,
        stepName: 'Step 1',
        stepCategory: 'identification',
        stepOrder: 1,
        actionType: 'manual_choice',
        instructions: null,
        deviceCategory: null,
        deviceSerialNumber: null,
        groupId: 'g-1',
        groupName: 'Identificazione',
        groupCategory: 'identification',
        groupSupportsParallel: false,
        recoveryStage: null,
        attemptCount: 0,
      },
    ],
  }),
  useMyWorkOrders: () => ({
    isLoading: false,
    isError: false,
    data: [
      {
        id: 'wo-1',
        code: 'WO-2026-0042',
        itemCode: 'ITM-FG-00042',
        itemName: 'Brake Caliper Assembly',
        quantity: 100,
        completed: 0,
        priority: 'normal',
        status: 'in_progress',
        startedAt: null,
        shiftCode: 'A',
      },
    ],
  }),
  useTransitionStep: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(async () => {}),
    isPending: false,
  }),
  useStepTransitionSubscription: () => undefined,
}))

vi.mock('../../../components/StepCard', () => ({
  StepCard: () => <div data-testid="step-card" />,
}))

vi.mock('../../../components/ParallelStepLane', () => ({
  ParallelStepLane: () => <div data-testid="parallel-step-lane" />,
}))

vi.mock('../../../components/RecoveryFlow', () => ({
  RecoveryFlow: () => <div data-testid="recovery-flow" />,
}))

vi.mock('../../../components/HMIScrapForm', () => ({
  HMIScrapForm: () => <div data-testid="scrap-form" />,
  derivePhaseFromStep: () => 'production',
}))

vi.mock('./components/DeviceCycleWithParallels', () => ({
  DeviceCycleWithParallels: () => <div data-testid="device-cycle-with-parallels" />,
}))

import WorkOrderExecutionPage from './page'

describe('HMI WO page inside HMIShell', () => {
  it('renders the shell title with the WO item name', () => {
    render(<WorkOrderExecutionPage />)
    expect(screen.getByText('Brake Caliper Assembly')).toBeInTheDocument()
  })

  it('renders the shell subtitle with WO code + step counter', () => {
    render(<WorkOrderExecutionPage />)
    expect(screen.getByText(/WO-2026-0042.*0 \/ 1 step/)).toBeInTheDocument()
  })

  it('renders the Esci footer HMIBigBtn', () => {
    render(<WorkOrderExecutionPage />)
    expect(screen.getByRole('button', { name: 'Esci' })).toBeInTheDocument()
  })
})
