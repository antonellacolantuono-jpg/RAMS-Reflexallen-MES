import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const toolsGet = vi.fn()
const toolsUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    tools: {
      get: (...a: unknown[]) => toolsGet(...a),
      update: (...a: unknown[]) => toolsUpdate(...a),
    },
  },
}))

import EditToolPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  toolsGet.mockReset()
  toolsUpdate.mockReset()
})

describe('EditToolPage', () => {
  it('hydrates with existing values and exposes editable fields only', async () => {
    toolsGet.mockResolvedValue({
      id: 't1',
      code: 'TOOL-CRIMP-DIE-01',
      name: 'Crimp die DN8',
      equipmentNodeId: 'eq-1',
      currentCyclesCount: 1500,
      maxCycles: 5000,
      wearStatus: 'good',
      lastUsedAt: null,
      replacedAt: null,
      replacementCount: 0,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })

    renderWithQuery(<EditToolPage params={{ id: 't1' }} />)

    await waitFor(() => {
      expect(screen.getByText('Modifica: TOOL-CRIMP-DIE-01')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Crimp die DN8')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
    expect(screen.getByText(/non sono modificabili/i)).toBeInTheDocument()
  })
})
