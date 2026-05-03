import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/maintenance-orders',
  useSearchParams: () => new URLSearchParams(),
}))

const mntList = vi.fn().mockResolvedValue({
  data: [
    {
      id: 'mnt-1',
      code: 'MNT-2026-0001',
      type: 'preventive',
      status: 'scheduled',
      priority: 'normal',
      plannedStart: '2026-05-10T08:00:00Z',
      description: 'Pulizia testa estrusione',
      equipmentNode: { id: 'eq-1', code: 'EQ-EXT-01A', name: 'Estrusore principale' },
    },
  ],
  total: 1,
  page: 1,
  limit: 25,
  totalPages: 1,
})
const mntTrash = vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 25, totalPages: 0 })

vi.mock('../../../lib/sdk', () => ({
  sdk: {
    maintenanceOrders: {
      list: (...a: unknown[]) => mntList(...a),
      trash: (...a: unknown[]) => mntTrash(...a),
      delete: vi.fn(),
    },
  },
}))

import MaintenanceOrdersPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  mntList.mockClear()
})

describe('MaintenanceOrdersPage (list)', () => {
  it('renders the page title and the seeded row with status badge', async () => {
    renderWithQuery(<MaintenanceOrdersPage />)
    expect(screen.getByText('Manutenzioni')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('MNT-2026-0001')).toBeInTheDocument()
    })
    expect(screen.getByText(/Pianificata/i)).toBeInTheDocument()
    // Equipment code shown in row
    expect(screen.getByText(/EQ-EXT-01A/)).toBeInTheDocument()
  })

  it('calls list() when mounted', async () => {
    renderWithQuery(<MaintenanceOrdersPage />)
    await waitFor(() => {
      expect(mntList).toHaveBeenCalled()
    })
  })
})
