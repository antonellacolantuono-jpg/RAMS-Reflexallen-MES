import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const boxTypesGet = vi.fn()
const boxTypesAudit = vi.fn()
const boxTypesDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    boxTypes: {
      get: (...a: unknown[]) => boxTypesGet(...a),
      audit: (...a: unknown[]) => boxTypesAudit(...a),
      delete: (...a: unknown[]) => boxTypesDelete(...a),
    },
  },
}))

import BoxTypeDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  boxTypesGet.mockReset()
  boxTypesAudit.mockReset()
  boxTypesDelete.mockReset()
})

describe('BoxTypeDetailPage', () => {
  it('renders detail tabs with capacity and returnable info', async () => {
    boxTypesGet.mockResolvedValue({
      id: 'bt1',
      code: 'BTYPE-CBX-014',
      name: 'Cartone 60×40×30',
      maxWeightG: 25000,
      maxVolumeL: 72,
      maxUnitsCount: 100,
      isReturnable: true,
      description: null,
      plantId: 'plant-1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    boxTypesAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<BoxTypeDetailPage params={{ id: 'bt1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Cartone 60×40×30').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Dettagli' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
