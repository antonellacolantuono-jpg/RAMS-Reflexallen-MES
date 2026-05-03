import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const toolsCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { tools: { create: (...a: unknown[]) => toolsCreate(...a) } },
}))

import NewToolPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  toolsCreate.mockReset()
})

describe('NewToolPage', () => {
  it('renders the form and the system-managed wear notice', () => {
    renderWithQuery(<NewToolPage />)
    expect(screen.getByText('Nuova attrezzatura')).toBeInTheDocument()
    expect(screen.getByText('Codice')).toBeInTheDocument()
    expect(screen.getByText('Cicli massimi')).toBeInTheDocument()
    expect(screen.getByText(/ToolWearHistory/i)).toBeInTheDocument()
  })
})
