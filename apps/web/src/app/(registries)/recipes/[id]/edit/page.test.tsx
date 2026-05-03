import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const recipesGet = vi.fn()
const recipesUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    recipes: {
      get: (...a: unknown[]) => recipesGet(...a),
      update: (...a: unknown[]) => recipesUpdate(...a),
    },
  },
}))

import EditRecipePage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  recipesGet.mockReset()
  recipesUpdate.mockReset()
})

describe('EditRecipePage', () => {
  it('prefills the form from the loaded recipe', async () => {
    recipesGet.mockResolvedValue({
      id: 'r1',
      code: 'RCP-001',
      name: 'My recipe',
      status: 'draft',
      plantId: 'p1',
      deviceId: 'd1',
      itemId: 'i1',
      version: 1,
      createdAt: '',
      updatedAt: '',
    })
    renderWithQuery(<EditRecipePage params={{ id: 'r1' }} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('My recipe')).toBeInTheDocument()
    })
    expect(screen.getByText(/Modifica: RCP-001/)).toBeInTheDocument()
  })
})
