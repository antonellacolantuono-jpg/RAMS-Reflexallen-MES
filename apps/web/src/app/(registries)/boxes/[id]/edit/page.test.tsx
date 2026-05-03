import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const boxesGet = vi.fn()
const boxesUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    boxes: {
      get: (...a: unknown[]) => boxesGet(...a),
      update: (...a: unknown[]) => boxesUpdate(...a),
    },
  },
}))

import EditBoxPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  boxesGet.mockReset()
  boxesUpdate.mockReset()
})

describe('EditBoxPage', () => {
  it('loads operational fields and shows admin override disclaimer', async () => {
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

    renderWithQuery(<EditBoxPage params={{ id: 'b1' }} />)

    await waitFor(() => {
      expect(screen.getByText(/Modifica collo:/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Normalmente gestito dal flusso pack-out/i)).toBeInTheDocument()
    expect(screen.getByText('Stato')).toBeInTheDocument()
    expect(screen.getByText('Lotto associato')).toBeInTheDocument()
  })
})
