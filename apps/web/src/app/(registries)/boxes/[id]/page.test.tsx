import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const boxesGet = vi.fn()
const boxesAudit = vi.fn()
const boxesDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    boxes: {
      get: (...a: unknown[]) => boxesGet(...a),
      audit: (...a: unknown[]) => boxesAudit(...a),
      delete: (...a: unknown[]) => boxesDelete(...a),
    },
  },
}))

import BoxDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  boxesGet.mockReset()
  boxesAudit.mockReset()
  boxesDelete.mockReset()
})

describe('BoxDetailPage', () => {
  it('renders 3 tabs including the read-only Stato tab', async () => {
    boxesGet.mockResolvedValue({
      id: 'b1',
      code: 'BOX-2026-001',
      boxTypeId: 'bt1',
      status: 'filling',
      currentWeightG: 1200,
      currentVolumeL: 4.5,
      currentUnitsCount: 12,
      lotId: 'lot-1',
      sealedAt: null,
      sealedBy: null,
      cyclesCount: 3,
      plantId: 'plant-1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    boxesAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<BoxDetailPage params={{ id: 'b1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('BOX-2026-001').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Stato' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
