import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back }) }))

const equipmentGet = vi.fn()
const equipmentUpdate = vi.fn()
vi.mock('../../../../../lib/sdk', () => ({
  sdk: {
    equipment: {
      get: (...a: unknown[]) => equipmentGet(...a),
      update: (...a: unknown[]) => equipmentUpdate(...a),
    },
  },
}))

import EditEquipmentPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  push.mockReset()
  back.mockReset()
  equipmentGet.mockReset()
  equipmentUpdate.mockReset()
})

describe('EditEquipmentPage', () => {
  it('prefills the form from the loaded equipment node', async () => {
    equipmentGet.mockResolvedValue({
      id: 'eq1',
      code: 'WC-EXTRUDER-01',
      name: 'Estrusore PA12 #1',
      level: 'work_center',
      class: 'production',
      status: 'available',
      parentId: null,
      plantId: 'plant_1',
      description: 'Linea estrusione principale',
      createdAt: '',
      updatedAt: '',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    renderWithQuery(<EditEquipmentPage params={{ id: 'eq1' }} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Estrusore PA12 #1')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Linea estrusione principale')).toBeInTheDocument()
    expect(screen.getByText(/Modifica: WC-EXTRUDER-01/)).toBeInTheDocument()
  })
})
