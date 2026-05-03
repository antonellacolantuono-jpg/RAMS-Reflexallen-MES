import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const skillsCreate = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { skills: { create: (...a: unknown[]) => skillsCreate(...a) } },
}))

import NewSkillPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  skillsCreate.mockReset()
})

describe('NewSkillPage', () => {
  it('renders the form with all required fields', () => {
    renderWithQuery(<NewSkillPage />)
    expect(screen.getByText('Nuova competenza')).toBeInTheDocument()
    expect(screen.getByText('Codice')).toBeInTheDocument()
    expect(screen.getByText('Categoria')).toBeInTheDocument()
  })
})
