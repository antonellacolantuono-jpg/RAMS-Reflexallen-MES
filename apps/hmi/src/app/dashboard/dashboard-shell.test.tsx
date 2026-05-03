import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock('../../lib/queries', () => ({
  useMe: () => ({ isLoading: false, data: { id: 'op-1', firstName: 'Marco', lastName: 'Conti', badge: 'OP-0142', skillCodes: ['QC'] }, error: null }),
  useMyWorkOrders: () => ({ isLoading: false, isError: false, data: [] }),
  useLogout: () => ({ mutateAsync: vi.fn(async () => {}), isPending: false }),
  useWoAssignedSubscription: () => undefined,
}))

vi.mock('../../lib/operator-store', () => ({
  useOperatorStore: (selector: (s: { setOperator: (o: unknown) => void }) => unknown) =>
    selector({ setOperator: vi.fn() }),
}))

vi.mock('../../components/WorkOrderCard', () => ({
  WorkOrderCard: () => <div data-testid="wo-card" />,
}))

import DashboardPage from './page'

describe('HMI Dashboard inside HMIShell', () => {
  it('renders the operator name and badge inside the shell sub', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Ordini di lavoro')).toBeInTheDocument()
    // Operator + badge appear in the dark header subtitle
    expect(screen.getByText(/Marco Conti.*Badge OP-0142/)).toBeInTheDocument()
  })

  it('renders Esci HMIBigBtn in the footer', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('button', { name: 'Esci' })).toBeInTheDocument()
  })

  it('renders Revisione QC HMIBigBtn in the header right when operator has QC skill', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('button', { name: 'Revisione QC' })).toBeInTheDocument()
  })
})
