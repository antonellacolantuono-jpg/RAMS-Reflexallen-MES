import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const apCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { attentionPoints: { create: (...a: unknown[]) => apCreate(...a) } },
}))

import NewAttentionPointPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  apCreate.mockReset()
})

describe('NewAttentionPointPage', () => {
  it('renders the form with polymorphic entityType, entityId, severity, and message fields', () => {
    renderWithQuery(<NewAttentionPointPage />)
    expect(screen.getByText('Nuovo punto di attenzione')).toBeInTheDocument()
    expect(screen.getByText('Tipo entità')).toBeInTheDocument()
    expect(screen.getByText('ID entità')).toBeInTheDocument()
    expect(screen.getByText('Messaggio')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Critico' })).toBeInTheDocument()
  })
})
