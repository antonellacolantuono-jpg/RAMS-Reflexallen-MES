import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'

// next/link spec — we render components in isolation so the mock is simple.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...rest }, children),
}))

import { ItemBomPanel } from './ItemBomPanel'
import { ItemToolsPanel } from './ItemToolsPanel'
import { ItemSkillsPanel } from './ItemSkillsPanel'
import { ItemWorkflowsPanel } from './ItemWorkflowsPanel'
import { ItemWorkLocationsPanel } from './ItemWorkLocationsPanel'
import { ItemProductionStatsCard } from './ItemProductionStatsCard'

describe('ItemBomPanel', () => {
  it('shows empty state when no components', () => {
    render(<ItemBomPanel bom={[]} />)
    expect(screen.getByText(/Nessun componente/)).toBeDefined()
  })

  it('renders BOM lines with click-through link to component item', () => {
    render(
      <ItemBomPanel
        bom={[
          {
            id: 'l1',
            componentId: 'comp-1',
            componentCode: 'RAW-001',
            componentName: 'PA12 pellet',
            qty: 0.5,
            uom: 'kg',
            position: 1,
            isOptional: false,
            notes: null,
          },
          {
            id: 'l2',
            componentId: 'comp-2',
            componentCode: 'EVOH-002',
            componentName: 'EVOH layer',
            qty: 0.1,
            uom: 'kg',
            position: 2,
            isOptional: true,
            notes: null,
          },
        ]}
      />,
    )
    const link = screen.getByText('RAW-001').closest('a')
    expect(link?.getAttribute('href')).toBe('/items/comp-1')
    expect(screen.getByText('PA12 pellet')).toBeDefined()
    expect(screen.getByText('opzionale')).toBeDefined()
    expect(screen.getByText('2 componenti')).toBeDefined()
  })
})

describe('ItemToolsPanel', () => {
  it('shows empty state when no tools', () => {
    render(<ItemToolsPanel tools={[]} />)
    expect(screen.getByText(/Nessun utensile/)).toBeDefined()
  })

  it('renders tools with wear status badge', () => {
    render(
      <ItemToolsPanel
        tools={[
          {
            id: 't1',
            code: 'TOOL-MOLD-001',
            name: 'Mold #1',
            wearStatus: 'warn',
            currentCyclesCount: 800,
            maxCycles: 1000,
            workflowNames: ['WF-PNE-001'],
          },
        ]}
      />,
    )
    expect(screen.getByText('TOOL-MOLD-001')).toBeDefined()
    expect(screen.getByText('Attenzione')).toBeDefined()
    expect(screen.getByText(/800 \/ 1000 cicli/)).toBeDefined()
  })
})

describe('ItemSkillsPanel', () => {
  it('shows empty state when no skills', () => {
    render(<ItemSkillsPanel skills={[]} />)
    expect(screen.getByText(/Nessuna competenza/)).toBeDefined()
  })

  it('renders skills with category badge', () => {
    render(
      <ItemSkillsPanel
        skills={[
          {
            id: 's1',
            code: 'EXT-OP',
            name: 'Operatore Estrusione',
            category: 'production',
            workflowNames: ['WF-PNE-001'],
          },
        ]}
      />,
    )
    expect(screen.getByText('EXT-OP')).toBeDefined()
    expect(screen.getByText('Operatore Estrusione')).toBeDefined()
    expect(screen.getByText('production')).toBeDefined()
  })
})

describe('ItemWorkflowsPanel', () => {
  it('renders empty state with CTA to create workflow', () => {
    render(<ItemWorkflowsPanel workflows={[]} />)
    expect(screen.getByText(/Nessun workflow collegato/)).toBeDefined()
    const cta = screen.getByText(/Crea un workflow per questo articolo/)
    expect(cta.closest('a')?.getAttribute('href')).toBe('/workflows/new')
  })

  it('renders workflows with click-through to workflow editor', () => {
    render(
      <ItemWorkflowsPanel
        workflows={[
          {
            id: 'wf1',
            code: 'WF-PNE-001',
            name: 'Pneumatic Air',
            currentVersionNumber: 3,
            stepsCount: 12,
          },
        ]}
      />,
    )
    const row = screen.getByText('WF-PNE-001').closest('a')
    expect(row?.getAttribute('href')).toBe('/workflows/wf1')
    expect(screen.getByText('12 step')).toBeDefined()
    expect(screen.getByText('v3')).toBeDefined()
  })
})

describe('ItemWorkLocationsPanel', () => {
  it('shows empty state when no work centers', () => {
    render(<ItemWorkLocationsPanel workCenters={[]} />)
    expect(screen.getByText(/Nessuna cella di lavoro/)).toBeDefined()
  })

  it('renders WC tree with WUs and toggles expansion', () => {
    render(
      <ItemWorkLocationsPanel
        workCenters={[
          {
            workCenter: { id: 'wc1', code: 'WC-LEAK', name: 'Leak Test', status: 'available' },
            workUnits: [
              {
                id: 'wu1',
                code: 'WS-LEAK-01',
                name: 'Postazione Leak 1',
                status: 'available',
                activeDevicesCount: 1,
              },
            ],
          },
        ]}
      />,
    )
    // WU initially visible (default expanded)
    expect(screen.getByTestId('wu-row-WS-LEAK-01')).toBeDefined()
    // Toggle WC
    fireEvent.click(screen.getByTestId('wc-toggle-WC-LEAK'))
    expect(screen.queryByTestId('wu-row-WS-LEAK-01')).toBeNull()
  })
})

describe('ItemProductionStatsCard', () => {
  it('renders 3 KPI tiles with mock banner', () => {
    render(
      <ItemProductionStatsCard
        stats={{ woCompleted: 0, scrapRate: 0, avgCycleTimeSec: 0, isMock: true }}
      />,
    )
    expect(screen.getByText('WO completati')).toBeDefined()
    expect(screen.getByText('Tasso scarto')).toBeDefined()
    expect(screen.getByText('Tempo ciclo medio')).toBeDefined()
    expect(screen.getByText('dati simulati')).toBeDefined()
  })
})
