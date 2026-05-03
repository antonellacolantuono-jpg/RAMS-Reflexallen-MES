import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const operatorsCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { operators: { create: (...a: unknown[]) => operatorsCreate(...a) } },
}))

import NewOperatorPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  operatorsCreate.mockReset()
})

describe('NewOperatorPage', () => {
  it('renders the form and the skills deferred-feature notice', () => {
    renderWithQuery(<NewOperatorPage />)
    expect(screen.getByText('Nuovo operatore')).toBeInTheDocument()
    expect(screen.getByText(/PIN \(4-6 cifre\)/)).toBeInTheDocument()
    expect(
      screen.getByText(/gestione delle skill assegnate .* batch successivo/i),
    ).toBeInTheDocument()
  })
})
