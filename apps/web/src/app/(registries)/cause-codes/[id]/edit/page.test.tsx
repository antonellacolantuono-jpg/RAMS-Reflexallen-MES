import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const causeCodesGet = vi.fn()
const causeCodesUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    causeCodes: {
      get: (...a: unknown[]) => causeCodesGet(...a),
      update: (...a: unknown[]) => causeCodesUpdate(...a),
    },
  },
}))

import EditCauseCodePage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  causeCodesGet.mockReset()
  causeCodesUpdate.mockReset()
})

describe('EditCauseCodePage', () => {
  it('hydrates the form with existing values once loaded', async () => {
    causeCodesGet.mockResolvedValue({
      id: 'cc1',
      code: 'CC-LEAK-FAIL',
      name: 'Fallita prova di tenuta',
      category: 'defect',
      phase: 'test',
      description: 'Descrizione',
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })

    renderWithQuery(<EditCauseCodePage params={{ id: 'cc1' }} />)

    await waitFor(() => {
      expect(screen.getByText('Modifica: CC-LEAK-FAIL')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Fallita prova di tenuta')).toBeInTheDocument()
  })
})
