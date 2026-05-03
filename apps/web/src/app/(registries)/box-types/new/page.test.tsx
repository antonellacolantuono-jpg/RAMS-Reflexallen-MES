import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const boxTypesCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { boxTypes: { create: (...a: unknown[]) => boxTypesCreate(...a) } },
}))

import NewBoxTypePage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  boxTypesCreate.mockReset()
})

describe('NewBoxTypePage', () => {
  it('renders the create form with capacity and returnable fields', () => {
    renderWithQuery(<NewBoxTypePage />)
    expect(screen.getByText('Nuovo tipo collo')).toBeInTheDocument()
    expect(screen.getByText('Codice')).toBeInTheDocument()
    expect(screen.getByText('Capacità (pezzi)')).toBeInTheDocument()
    expect(screen.getByText(/restituibile/i)).toBeInTheDocument()
  })
})
