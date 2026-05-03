import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const toolsGet = vi.fn()
const toolsAudit = vi.fn()
const toolsDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    tools: {
      get: (...a: unknown[]) => toolsGet(...a),
      audit: (...a: unknown[]) => toolsAudit(...a),
      delete: (...a: unknown[]) => toolsDelete(...a),
    },
  },
}))

import ToolDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  toolsGet.mockReset()
  toolsAudit.mockReset()
  toolsDelete.mockReset()
})

describe('ToolDetailPage', () => {
  it('renders detail tabs including the read-only Usura tab', async () => {
    toolsGet.mockResolvedValue({
      id: 't1',
      code: 'TOOL-CRIMP-DIE-01',
      name: 'Crimp die DN8',
      equipmentNodeId: 'eq-1',
      currentCyclesCount: 1500,
      maxCycles: 5000,
      wearStatus: 'good',
      lastUsedAt: '2026-04-25T10:00:00.000Z',
      replacedAt: null,
      replacementCount: 0,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    toolsAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<ToolDetailPage params={{ id: 't1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Crimp die DN8').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Usura' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
