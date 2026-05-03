import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const equipmentGet = vi.fn()
const equipmentAudit = vi.fn()
const equipmentDelete = vi.fn()
const toolsList = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    equipment: {
      get: (...a: unknown[]) => equipmentGet(...a),
      audit: (...a: unknown[]) => equipmentAudit(...a),
      delete: (...a: unknown[]) => equipmentDelete(...a),
    },
    tools: {
      list: (...a: unknown[]) => toolsList(...a),
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
  toolsList.mockReset()
  toolsList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })
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

  it('renders the Risorse tab for work_unit/work_center levels with tools query and mock sections', async () => {
    equipmentGet.mockResolvedValue({
      id: 'eq-wu-1',
      code: 'WU-LEAK-01',
      name: 'Postazione Leak Test 1',
      level: 'work_unit',
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
    toolsList.mockResolvedValue({
      data: [
        {
          id: 't1',
          code: 'TOOL-DIE-01',
          name: 'Stampo crimp 8mm',
          wearStatus: 'good',
          currentCyclesCount: 1240,
          maxCycles: 10000,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    })

    renderWithQuery(<EquipmentDetailPage params={{ id: 'eq-wu-1' }} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Risorse' })).toBeInTheDocument()
    })

    // Switch to Risorse tab
    screen.getByRole('button', { name: 'Risorse' }).click()

    await waitFor(() => {
      expect(toolsList).toHaveBeenCalledWith({ equipmentNodeId: 'eq-wu-1' })
    })

    // Mock devices visible
    expect(screen.getByText('DEV-LEAK-001')).toBeInTheDocument()
    // Real tool from query visible
    expect(screen.getByText('TOOL-DIE-01')).toBeInTheDocument()
    // Mock skills visible
    expect(screen.getByText('PNE-LEAK-CERT')).toBeInTheDocument()
    // Mock operators visible
    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
    // Materials amber notice (no mock data)
    expect(
      screen.getByText('Materiali per postazione: configurazione in arrivo'),
    ).toBeInTheDocument()
  })

  it('does NOT render the Risorse tab for non-resource levels (e.g. enterprise)', async () => {
    equipmentGet.mockResolvedValue({
      id: 'eq-ent-1',
      code: 'ENT-RFLX',
      name: 'Reflexallen Group',
      level: 'enterprise',
      class: 'administrative',
      status: 'available',
      parentId: null,
      plantId: 'plant_1',
      description: null,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-25T10:00:00.000Z',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    })
    equipmentAudit.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    renderWithQuery(<EquipmentDetailPage params={{ id: 'eq-ent-1' }} />)

    await waitFor(() => {
      expect(screen.getAllByText('Reflexallen Group').length).toBeGreaterThan(0)
    })
    expect(screen.queryByRole('button', { name: 'Risorse' })).not.toBeInTheDocument()
    expect(toolsList).not.toHaveBeenCalled()
  })
})
