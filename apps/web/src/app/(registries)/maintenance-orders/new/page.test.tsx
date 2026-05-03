import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const mntCreate = vi.fn()
const eqList = vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 25, totalPages: 0 })
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    maintenanceOrders: { create: (...a: unknown[]) => mntCreate(...a) },
    equipment: { list: (...a: unknown[]) => eqList(...a) },
  },
}))

import NewMaintenanceOrderPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  mntCreate.mockReset()
})

describe('NewMaintenanceOrderPage', () => {
  it('renders the form with all required fields and the auto-code notice', () => {
    renderWithQuery(<NewMaintenanceOrderPage />)
    expect(screen.getByText('Nuovo ordine di manutenzione')).toBeInTheDocument()
    expect(screen.getByText('Impianto')).toBeInTheDocument()
    expect(screen.getByText('Tipo')).toBeInTheDocument()
    expect(screen.getByText('Priorità')).toBeInTheDocument()
    expect(screen.getByText('Descrizione')).toBeInTheDocument()
    expect(screen.getByText('Inizio pianificato')).toBeInTheDocument()
    expect(screen.getByText('Fine pianificata')).toBeInTheDocument()
    expect(screen.getByText(/MNT-AAAA-NNNN/i)).toBeInTheDocument()
    expect(screen.getByText(/TODO-062/i)).toBeInTheDocument()
  })

  it('shows the equipment select dropdown', () => {
    renderWithQuery(<NewMaintenanceOrderPage />)
    expect(screen.getByTestId('mnt-equipment-select')).toBeInTheDocument()
  })
})
