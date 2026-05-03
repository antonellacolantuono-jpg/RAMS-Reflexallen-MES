import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const recipesGet = vi.fn()
const recipesAudit = vi.fn()
const recipesDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    recipes: {
      get: (...a: unknown[]) => recipesGet(...a),
      audit: (...a: unknown[]) => recipesAudit(...a),
      delete: (...a: unknown[]) => recipesDelete(...a),
    },
  },
}))

import RecipeDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  recipesGet.mockReset()
  recipesAudit.mockReset()
  recipesDelete.mockReset()
})

describe('RecipeDetailPage', () => {
  it('renders detail tabs including the Versions stub when recipe loaded', async () => {
    recipesGet.mockResolvedValue({
      id: 'r1',
      code: 'RCP-LEAK-001',
      name: 'Caliper standard',
      status: 'approved',
      plantId: 'plant_1',
      deviceId: 'd1',
      itemId: 'i1',
      version: 3,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
    })
    recipesAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<RecipeDetailPage params={{ id: 'r1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Caliper standard').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText(/RCP-LEAK-001/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Versioni' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
