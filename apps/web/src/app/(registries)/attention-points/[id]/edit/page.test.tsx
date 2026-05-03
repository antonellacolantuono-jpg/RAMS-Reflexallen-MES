import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const apGet = vi.fn()
const apResolve = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    attentionPoints: {
      get: (...a: unknown[]) => apGet(...a),
      resolve: (...a: unknown[]) => apResolve(...a),
    },
  },
}))

import ResolveAttentionPointPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  apGet.mockReset()
  apResolve.mockReset()
})

describe('ResolveAttentionPointPage', () => {
  it('renders the resolve form for an open alert with read-only context', async () => {
    apGet.mockResolvedValue({
      id: 'ap1',
      entityType: 'WorkOrder',
      entityId: 'wo-cuid-001',
      severity: 'warning',
      message: 'Lotto in quarantena prolungata',
      resolvedAt: null,
      resolvedBy: null,
      resolveNote: null,
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      createdBy: 'system',
    })

    renderWithQuery(<ResolveAttentionPointPage params={{ id: 'ap1' }} />)

    await waitFor(() => {
      expect(screen.getByText('Risolvi punto di attenzione')).toBeInTheDocument()
    })
    expect(screen.getByText('Risolto da')).toBeInTheDocument()
    expect(screen.getByText('Nota di risoluzione')).toBeInTheDocument()
    expect(screen.getByText('Lotto in quarantena prolungata')).toBeInTheDocument()
  })

  it('shows already-resolved state when the alert is closed', async () => {
    apGet.mockResolvedValue({
      id: 'ap2',
      entityType: 'Lot',
      entityId: 'lot-cuid-001',
      severity: 'critical',
      message: 'Difetto rilevato',
      resolvedAt: '2026-04-25T10:00:00.000Z',
      resolvedBy: 'mario.rossi',
      resolveNote: 'Bloccato',
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      createdBy: 'system',
    })

    renderWithQuery(<ResolveAttentionPointPage params={{ id: 'ap2' }} />)

    await waitFor(() => {
      expect(screen.getByText('Già risolto')).toBeInTheDocument()
    })
  })
})
