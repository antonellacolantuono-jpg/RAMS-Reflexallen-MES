import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back }),
}))

const recipesCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { recipes: { create: (...a: unknown[]) => recipesCreate(...a) } },
}))

import NewRecipePage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  recipesCreate.mockReset()
})

describe('NewRecipePage', () => {
  it('renders the form with required fields', () => {
    renderWithQuery(<NewRecipePage />)
    expect(screen.getByText('Nuova ricetta')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('es. RCP-LEAK-001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('cuid dello stabilimento')).toBeInTheDocument()
  })
})
