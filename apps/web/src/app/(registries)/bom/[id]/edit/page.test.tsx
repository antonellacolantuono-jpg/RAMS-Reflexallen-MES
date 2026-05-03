import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const bomGet = vi.fn()
const bomUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    bom: {
      get: (...a: unknown[]) => bomGet(...a),
      update: (...a: unknown[]) => bomUpdate(...a),
    },
  },
}))

import EditBomPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  bomGet.mockReset()
  bomUpdate.mockReset()
})

describe('EditBomPage', () => {
  it('prefills the form from the loaded BoM and surfaces lines-deferred notice', async () => {
    bomGet.mockResolvedValue({
      id: 'b1',
      itemId: 'i1',
      version: 1,
      status: 'draft',
      notes: 'Some notes',
      createdAt: '',
      updatedAt: '',
      lines: [],
      createdBy: 'system',
      updatedBy: 'system',
    })
    renderWithQuery(<EditBomPage params={{ id: 'b1' }} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Some notes')).toBeInTheDocument()
    })
    expect(screen.getByText(/Modifica BOM v1/)).toBeInTheDocument()
    expect(
      screen.getByText(/modifica delle linee BOM .* in un batch successivo/i),
    ).toBeInTheDocument()
  })
})
