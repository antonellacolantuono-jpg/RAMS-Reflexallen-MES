import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const apGet = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { attentionPoints: { get: (...a: unknown[]) => apGet(...a) } },
}))

import AttentionPointDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  apGet.mockReset()
})

describe('AttentionPointDetailPage', () => {
  it('renders an open attention point with a Risolvi action and lifecycle tab', async () => {
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

    renderWithQuery(<AttentionPointDetailPage params={{ id: 'ap1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Lotto in quarantena prolungata').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Risoluzione' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Risolvi' }).length).toBeGreaterThan(0)
  })

  it('shows resolved state when the alert has resolvedAt', async () => {
    apGet.mockResolvedValue({
      id: 'ap2',
      entityType: 'Lot',
      entityId: 'lot-cuid-001',
      severity: 'critical',
      message: 'Difetto rilevato in scarto',
      resolvedAt: '2026-04-25T10:00:00.000Z',
      resolvedBy: 'mario.rossi',
      resolveNote: 'Lotto bloccato e segregato.',
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      createdBy: 'system',
    })

    renderWithQuery(<AttentionPointDetailPage params={{ id: 'ap2' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Risolto').length).toBeGreaterThan(0)
    })
  })
})
