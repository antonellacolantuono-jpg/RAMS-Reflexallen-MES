import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const causeCodesCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { causeCodes: { create: (...a: unknown[]) => causeCodesCreate(...a) } },
}))

import NewCauseCodePage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  causeCodesCreate.mockReset()
})

describe('NewCauseCodePage', () => {
  it('renders the form with required fields and category select', () => {
    renderWithQuery(<NewCauseCodePage />)
    expect(screen.getByText('Nuovo codice causa')).toBeInTheDocument()
    expect(screen.getByText('Codice')).toBeInTheDocument()
    expect(screen.getByText('Categoria')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Difetto' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Rilavorazione' })).toBeInTheDocument()
  })
})
