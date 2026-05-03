import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const bomCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { bom: { create: (...a: unknown[]) => bomCreate(...a) } },
}))

import NewBomPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  bomCreate.mockReset()
})

describe('NewBomPage', () => {
  it('renders the form and the lines deferred-feature notice', () => {
    renderWithQuery(<NewBomPage />)
    expect(screen.getByText('Nuova distinta base')).toBeInTheDocument()
    expect(
      screen.getByText(/gestione delle linee BOM .* in un batch successivo/i),
    ).toBeInTheDocument()
  })
})
