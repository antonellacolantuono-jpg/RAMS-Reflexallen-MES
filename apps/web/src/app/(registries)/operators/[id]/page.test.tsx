import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const operatorsGet = vi.fn()
const operatorsAudit = vi.fn()
const operatorsDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    operators: {
      get: (...a: unknown[]) => operatorsGet(...a),
      audit: (...a: unknown[]) => operatorsAudit(...a),
      delete: (...a: unknown[]) => operatorsDelete(...a),
    },
  },
}))

import OperatorDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  operatorsGet.mockReset()
  operatorsAudit.mockReset()
  operatorsDelete.mockReset()
})

describe('OperatorDetailPage', () => {
  it('renders detail tabs including the Skills deferred-feature placeholder', async () => {
    operatorsGet.mockResolvedValue({
      id: 'op1',
      badge: 'OP-0142',
      firstName: 'Mario',
      lastName: 'Rossi',
      status: 'active',
      photoUrl: null,
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    operatorsAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<OperatorDetailPage params={{ id: 'op1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Mario Rossi').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Competenze' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
