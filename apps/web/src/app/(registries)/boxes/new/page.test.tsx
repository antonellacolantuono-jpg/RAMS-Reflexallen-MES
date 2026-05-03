import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const boxesCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { boxes: { create: (...a: unknown[]) => boxesCreate(...a) } },
}))

import NewBoxPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  boxesCreate.mockReset()
})

describe('NewBoxPage', () => {
  it('renders the create form with required FK fields and system-default notice', () => {
    renderWithQuery(<NewBoxPage />)
    expect(screen.getByText('Nuovo collo')).toBeInTheDocument()
    expect(screen.getByText('Codice')).toBeInTheDocument()
    expect(screen.getByText('Tipo collo (ID)')).toBeInTheDocument()
    expect(screen.getByText('Plant ID')).toBeInTheDocument()
    expect(screen.getByText(/inizializzati dal sistema/i)).toBeInTheDocument()
  })
})
