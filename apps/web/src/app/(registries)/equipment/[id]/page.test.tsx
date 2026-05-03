import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const equipmentGet = vi.fn()
const equipmentAudit = vi.fn()
const equipmentDelete = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    equipment: {
      get: (...a: unknown[]) => equipmentGet(...a),
      audit: (...a: unknown[]) => equipmentAudit(...a),
      delete: (...a: unknown[]) => equipmentDelete(...a),
    },
  },
}))

import EquipmentDetailPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  equipmentGet.mockReset()
  equipmentAudit.mockReset()
  equipmentDelete.mockReset()
})

describe('EquipmentDetailPage', () => {
  it('renders detail tabs including the Hierarchy deferred-feature placeholder', async () => {
    equipmentGet.mockResolvedValue({
      id: 'eq1',
      code: 'WC-EXTRUDER-01',
      name: 'Estrusore PA12 #1',
      level: 'work_center',
      class: 'production',
      status: 'available',
      parentId: 'eq-parent',
      plantId: 'plant_1',
      description: null,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    equipmentAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<EquipmentDetailPage params={{ id: 'eq1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Estrusore PA12 #1').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('button', { name: 'Gerarchia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attività' })).toBeInTheDocument()
  })
})
