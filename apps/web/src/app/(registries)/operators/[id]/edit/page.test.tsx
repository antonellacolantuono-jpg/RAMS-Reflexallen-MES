import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const operatorsGet = vi.fn()
const operatorsUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    operators: {
      get: (...a: unknown[]) => operatorsGet(...a),
      update: (...a: unknown[]) => operatorsUpdate(...a),
    },
  },
}))

import EditOperatorPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  operatorsGet.mockReset()
  operatorsUpdate.mockReset()
})

describe('EditOperatorPage', () => {
  it('prefills the form from the loaded operator and clears the PIN field', async () => {
    operatorsGet.mockResolvedValue({
      id: 'op1',
      badge: 'OP-0142',
      firstName: 'Mario',
      lastName: 'Rossi',
      status: 'active',
      photoUrl: null,
      plantId: 'plant_1',
      createdAt: '',
      updatedAt: '',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    renderWithQuery(<EditOperatorPage params={{ id: 'op1' }} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Rossi')).toBeInTheDocument()
    expect(screen.getByText(/Modifica: OP-0142/)).toBeInTheDocument()
  })
})
