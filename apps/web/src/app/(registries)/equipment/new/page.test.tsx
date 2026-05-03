import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const equipmentCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { equipment: { create: (...a: unknown[]) => equipmentCreate(...a) } },
}))

import NewEquipmentPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  equipmentCreate.mockReset()
})

describe('NewEquipmentPage', () => {
  it('renders the form and the hierarchy deferred-feature notice', () => {
    renderWithQuery(<NewEquipmentPage />)
    expect(screen.getByText('Nuovo equipaggiamento')).toBeInTheDocument()
    expect(
      screen.getByText(/visualizzazione ad albero della gerarchia ISA-95 .* batch successivo/i),
    ).toBeInTheDocument()
  })
})
