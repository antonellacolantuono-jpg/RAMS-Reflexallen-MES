import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const causeCodesGet = vi.fn()
const causeCodesAudit = vi.fn()
const causeCodesDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    causeCodes: {
      get: (...a: unknown[]) => causeCodesGet(...a),
      audit: (...a: unknown[]) => causeCodesAudit(...a),
      delete: (...a: unknown[]) => causeCodesDelete(...a),
    },
  },
}))

import CauseCodeDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  causeCodesGet.mockReset()
  causeCodesAudit.mockReset()
  causeCodesDelete.mockReset()
})

describe('CauseCodeDetailPage', () => {
  it('renders detail with localized category label', async () => {
    causeCodesGet.mockResolvedValue({
      id: 'cc1',
      code: 'CC-LEAK-FAIL',
      name: 'Fallita prova di tenuta',
      category: 'defect',
      phase: 'test',
      description: null,
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    causeCodesAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<CauseCodeDetailPage params={{ id: 'cc1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Fallita prova di tenuta').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Difetto').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
