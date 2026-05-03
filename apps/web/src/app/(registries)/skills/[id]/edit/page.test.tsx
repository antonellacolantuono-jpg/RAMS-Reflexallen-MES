import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const skillsGet = vi.fn()
const skillsUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    skills: {
      get: (...a: unknown[]) => skillsGet(...a),
      update: (...a: unknown[]) => skillsUpdate(...a),
    },
  },
}))

import EditSkillPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  skillsGet.mockReset()
  skillsUpdate.mockReset()
})

describe('EditSkillPage', () => {
  it('prefills the form from the loaded skill', async () => {
    skillsGet.mockResolvedValue({
      id: 's1',
      code: 'SKL-LEAK',
      name: 'Operatore prova di tenuta',
      category: 'test',
      description: 'Certifica esecuzione test tenuta pneumatica',
      plantId: 'plant_1',
      createdAt: '',
      updatedAt: '',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    renderWithQuery(<EditSkillPage params={{ id: 's1' }} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Operatore prova di tenuta')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    expect(screen.getByText(/Modifica: SKL-LEAK/)).toBeInTheDocument()
  })
})
