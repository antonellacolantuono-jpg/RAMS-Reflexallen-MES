import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const bomGet = vi.fn()
const bomTree = vi.fn()
const bomAudit = vi.fn()
const bomDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    bom: {
      get: (...a: unknown[]) => bomGet(...a),
      tree: (...a: unknown[]) => bomTree(...a),
      audit: (...a: unknown[]) => bomAudit(...a),
      delete: (...a: unknown[]) => bomDelete(...a),
    },
  },
}))

import BomDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  bomGet.mockReset()
  bomTree.mockReset()
  bomAudit.mockReset()
  bomDelete.mockReset()
})

describe('BomDetailPage', () => {
  it('renders empty Lines tab with the deferred-feature message when tree returns []', async () => {
    bomGet.mockResolvedValue({
      id: 'b1',
      itemId: 'i1',
      version: 2,
      status: 'approved',
      notes: 'Test BOM',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z',
      lines: [],
      createdBy: 'system',
      updatedBy: 'system',
    })
    bomTree.mockResolvedValue([])
    bomAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<BomDetailPage params={{ id: 'b1' }} />)

    await waitFor(() => {
      expect(screen.getByText(/BOM · v2/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Linee' })).toBeInTheDocument()
  })
})
