import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ResourceTabs } from './ResourceTabs'

vi.mock('../../../lib/sdk', () => ({
  sdk: {
    items: { list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 }) },
    tools: { list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 }) },
    equipment: { list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 }) },
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const NOOP = () => {}

const baseProps = {
  selectedMaterialIds: [] as string[],
  selectedToolIds: [] as string[],
  selectedDeviceIds: [] as string[],
  selectedSkillIds: [] as string[],
  selectedRecipeId: null as string | null,
  selectedAttentionPointIds: [] as string[],
  onToggleMaterial: NOOP,
  onToggleTool: NOOP,
  onToggleDevice: NOOP,
  onToggleSkill: NOOP,
  onToggleAttentionPoint: NOOP,
  onSelectRecipe: NOOP,
  onClearMaterials: NOOP,
  onClearTools: NOOP,
  onClearDevices: NOOP,
  onClearSkills: NOOP,
  onClearAttentionPoints: NOOP,
}

describe('ResourceTabs', () => {
  it('renders all 6 tabs with Italian labels and Materials active by default', () => {
    renderWithQuery(<ResourceTabs {...baseProps} />)

    expect(screen.getByRole('tab', { name: /Materiali/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Attrezzi/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Dispositivi/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Skill/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Ricette/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Attention Points/ })).toBeInTheDocument()

    expect(screen.getAllByRole('tab')).toHaveLength(6)

    // Default active tab is Materials → MaterialsTab body is mounted.
    expect(
      document.querySelector('[data-resource-tabs-content="materials"]'),
    ).not.toBeNull()
    expect(
      document.querySelector('[data-resource-list="materials"]'),
    ).not.toBeNull()
  })

  it('shows count badge + ok dot on tabs that have at least one selection', () => {
    const { container } = renderWithQuery(
      <ResourceTabs
        {...baseProps}
        selectedMaterialIds={['m1', 'm2', 'm3']}
        selectedDeviceIds={['d1']}
      />,
    )

    // Materials tab: count "3" + green dot. Devices tab: count "1" + green dot.
    const materialsTab = screen.getByRole('tab', { name: /Materiali/ })
    expect(materialsTab.textContent).toMatch(/3/)
    expect(materialsTab.querySelector('span.bg-ok')).not.toBeNull()

    const devicesTab = screen.getByRole('tab', { name: /Dispositivi/ })
    expect(devicesTab.textContent).toMatch(/1/)
    expect(devicesTab.querySelector('span.bg-ok')).not.toBeNull()

    // Tools tab: empty selection → no count, no dot.
    const toolsTab = screen.getByRole('tab', { name: /Attrezzi/ })
    expect(toolsTab.querySelector('span.bg-ok')).toBeNull()

    // 2 tabs have the ok dot; 4 don't.
    const dots = container.querySelectorAll('[role="tab"] span.bg-ok')
    expect(dots).toHaveLength(2)
  })
})
