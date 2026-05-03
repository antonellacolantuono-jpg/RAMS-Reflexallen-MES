import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const boxTypesGet = vi.fn()
const boxTypesUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    boxTypes: {
      get: (...a: unknown[]) => boxTypesGet(...a),
      update: (...a: unknown[]) => boxTypesUpdate(...a),
    },
  },
}))

import EditBoxTypePage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  boxTypesGet.mockReset()
  boxTypesUpdate.mockReset()
})

describe('EditBoxTypePage', () => {
  it('loads existing data and shows code-immutable notice', async () => {
    boxTypesGet.mockResolvedValue({
      id: 'bt1',
      code: 'BTYPE-CBX-014',
      name: 'Cartone 60×40×30',
      maxWeightG: 25000,
      maxVolumeL: 72,
      maxUnitsCount: 100,
      isReturnable: true,
      description: 'Cartone standard',
      plantId: 'plant-1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })

    renderWithQuery(<EditBoxTypePage params={{ id: 'bt1' }} />)

    await waitFor(() => {
      expect(screen.getByText(/Modifica:/)).toBeInTheDocument()
    })
    expect(screen.getByText(/codice non è modificabile/i)).toBeInTheDocument()
    expect(screen.getByText('Capacità (pezzi)')).toBeInTheDocument()
  })
})
