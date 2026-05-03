import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const equipmentList = vi.fn()
const boxesList = vi.fn()

vi.mock('../../lib/sdk', () => ({
  sdk: {
    equipment: { list: (...args: unknown[]) => equipmentList(...args) },
    boxes: { list: (...args: unknown[]) => boxesList(...args) },
  },
}))

import PlantOverviewDashboard from './page'
import { deriveEquipmentCounts, deriveBoxCounts } from '../../lib/dashboard-helpers'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  equipmentList.mockReset()
  boxesList.mockReset()
})

describe('PlantOverviewDashboard — page rendering', () => {
  it('renders the four mockup sections (header + KPIs + WOs/Activity + Equipment/Losses/Boxes)', async () => {
    equipmentList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 500, totalPages: 0 })
    boxesList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 500, totalPages: 0 })

    renderWithQuery(<PlantOverviewDashboard />)

    // Section 1: PageHeader
    expect(screen.getByText('Plant Overview')).toBeInTheDocument()
    expect(screen.getByText(/Stabilimento Modena/)).toBeInTheDocument()

    // Section 2: 6 KPIs
    expect(screen.getByText('OEE')).toBeInTheDocument()
    expect(screen.getByText('Disponibilità')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Qualità')).toBeInTheDocument()
    expect(screen.getByText('Throughput')).toBeInTheDocument()
    expect(screen.getByText('Scarto')).toBeInTheDocument()

    // Section 3: Active WOs + Live Activity
    expect(screen.getByText('Work Order attivi')).toBeInTheDocument()
    expect(screen.getByText('Attività live')).toBeInTheDocument()
    // Verify mock WO rows render (8 rows)
    expect(screen.getAllByRole('row')).toHaveLength(8)

    // Section 4: Equipment Status + 6 Big Losses + Box Inventory
    expect(screen.getByText('Stato impianti')).toBeInTheDocument()
    expect(screen.getByText('6 Grandi Perdite (oggi)')).toBeInTheDocument()
    expect(screen.getByText('Inventario imballi')).toBeInTheDocument()
  })

  it('propagates KPI warn tone to the value span (text-warn-ink)', async () => {
    equipmentList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 500, totalPages: 0 })
    boxesList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 500, totalPages: 0 })

    renderWithQuery(<PlantOverviewDashboard />)

    // OEE is configured with tone='warn' → its value "78.4" should carry text-warn-ink.
    const oeeValue = screen.getByText('78.4')
    expect(oeeValue.className).toMatch(/text-warn-ink/)

    // Disponibilità is tone='ok' → "91.2" should carry text-ok-ink.
    const availValue = screen.getByText('91.2')
    expect(availValue.className).toMatch(/text-ok-ink/)

    // Throughput has no tone → defaults to 'default' → text-ink, not warn/ok/bad.
    const throughputValue = screen.getByText('142')
    expect(throughputValue.className).not.toMatch(/text-warn-ink|text-ok-ink|text-bad-ink/)
  })

  it('renders skeleton placeholders for Equipment and Boxes while loading', () => {
    // Never resolve → useQuery stays in isLoading state.
    equipmentList.mockReturnValue(new Promise(() => {}))
    boxesList.mockReturnValue(new Promise(() => {}))

    renderWithQuery(<PlantOverviewDashboard />)

    expect(screen.getAllByTestId('equipment-skeleton')).toHaveLength(5)
    expect(screen.getAllByTestId('box-skeleton')).toHaveLength(6)
  })

  it('renders error message when Equipment fetch fails', async () => {
    equipmentList.mockRejectedValue(new Error('boom'))
    boxesList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 500, totalPages: 0 })

    renderWithQuery(<PlantOverviewDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Errore caricamento impianti')).toBeInTheDocument()
    })
  })
})

describe('deriveEquipmentCounts', () => {
  it('groups status values into the 5 visual buckets', () => {
    const rows = [
      { status: 'available' },
      { status: 'available' },
      { status: 'reserved' },     // counts as Disponibili
      { status: 'in_use' },
      { status: 'in_use' },
      { status: 'maintenance' },
      { status: 'cleaning' },     // counts as Manutenzione
      { status: 'broken' },
      { status: 'offline' },
      { status: 'decommissioned' }, // counts as Offline
    ]

    const result = deriveEquipmentCounts(rows)

    expect(result).toEqual([
      { label: 'Disponibili',  statuses: ['available', 'reserved'],     tone: 'ok',      count: 3 },
      { label: 'In uso',       statuses: ['in_use'],                    tone: 'warn',    count: 2 },
      { label: 'Manutenzione', statuses: ['maintenance', 'cleaning'],   tone: 'warn',    count: 2 },
      { label: 'Guasti',       statuses: ['broken'],                    tone: 'bad',     count: 1 },
      { label: 'Offline',      statuses: ['offline', 'decommissioned'], tone: 'neutral', count: 2 },
    ])
  })

  it('returns zero counts for an empty list', () => {
    const result = deriveEquipmentCounts([])
    expect(result.map((b) => b.count)).toEqual([0, 0, 0, 0, 0])
  })
})

describe('deriveBoxCounts', () => {
  it('groups status values into 5 status buckets and computes cyclesAvg from cyclesCount > 0', () => {
    const rows = [
      { status: 'empty',    cyclesCount: 0 },
      { status: 'empty',    cyclesCount: 0 },
      { status: 'filling',  cyclesCount: 0 },
      { status: 'full',     cyclesCount: 0 },
      { status: 'sealed',   cyclesCount: 12 },
      { status: 'shipped',  cyclesCount: 8 },
      { status: 'returned', cyclesCount: 22 },
      { status: 'damaged',  cyclesCount: 0 },
    ]

    const result = deriveBoxCounts(rows)

    // Order matches BOX_BUCKETS definition.
    expect(result[0]).toMatchObject({ label: 'Vuoti',                 count: 2 })
    expect(result[1]).toMatchObject({ label: 'Parzialmente riempiti', count: 1 })
    expect(result[2]).toMatchObject({ label: 'Pieni',                 count: 1 })
    expect(result[3]).toMatchObject({ label: 'Sigillati',             count: 3 })
    // cyclesAvg: (12 + 8 + 22) / 3 = 14
    expect(result[4]).toMatchObject({ label: 'Cicli rotazione ⌀', count: '14', isText: true })
    expect(result[5]).toMatchObject({ label: 'Danneggiati',           count: 1 })
  })

  it('returns "—" for cyclesAvg when no box has cyclesCount > 0', () => {
    const result = deriveBoxCounts([
      { status: 'empty', cyclesCount: 0 },
      { status: 'full',  cyclesCount: 0 },
    ])

    expect(result[4]?.count).toBe('—')
  })
})

describe('Showcase page production guard', () => {
  const notFoundFn = vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })

  beforeEach(() => {
    notFoundFn.mockClear()
    vi.resetModules()
    vi.doMock('next/navigation', () => ({ notFound: notFoundFn }))
  })

  afterEach(() => {
    vi.doUnmock('next/navigation')
    vi.unstubAllEnvs()
  })

  it('calls notFound() when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { default: ShowcasePage } = await import('../dev/showcase/page')

    // React retries the failing render up to 5 times via its error boundary
    // before giving up, so notFound() is invoked once per attempt — only the
    // throw + the fact that it was called at all are meaningful here.
    expect(() => render(<ShowcasePage />)).toThrow(/NEXT_NOT_FOUND/)
    expect(notFoundFn).toHaveBeenCalled()
  })

  it('does NOT call notFound() in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { default: ShowcasePage } = await import('../dev/showcase/page')

    // Should render without throwing.
    render(<ShowcasePage />)
    expect(notFoundFn).not.toHaveBeenCalled()
  })
})
