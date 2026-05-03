import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const skillsGet = vi.fn()
const skillsAudit = vi.fn()
const skillsDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    skills: {
      get: (...a: unknown[]) => skillsGet(...a),
      audit: (...a: unknown[]) => skillsAudit(...a),
      delete: (...a: unknown[]) => skillsDelete(...a),
    },
  },
}))

import SkillDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  skillsGet.mockReset()
  skillsAudit.mockReset()
  skillsDelete.mockReset()
})

describe('SkillDetailPage', () => {
  it('renders detail tabs including the Matrix deferred-feature placeholder', async () => {
    skillsGet.mockResolvedValue({
      id: 's1',
      code: 'SKL-LEAK',
      name: 'Operatore prova di tenuta',
      category: 'test',
      description: null,
      plantId: 'plant_1',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    skillsAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<SkillDetailPage params={{ id: 's1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Operatore prova di tenuta').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Matrice operatori' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
