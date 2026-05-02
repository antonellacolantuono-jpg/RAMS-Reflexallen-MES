import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RecipesTab } from './RecipesTab'

const recipesList = vi.fn()
const equipmentList = vi.fn()

vi.mock('../../../lib/sdk', () => ({
  sdk: {
    recipes: { list: (...args: unknown[]) => recipesList(...args) },
    equipment: { list: (...args: unknown[]) => equipmentList(...args) },
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const RECIPES = [
  { id: 'r1', code: 'RCP-LEAK-12-001', name: 'Test M12 standard', status: 'approved', deviceId: 'd1' },
  { id: 'r2', code: 'RCP-LEAK-15-001', name: 'Test M15 standard', status: 'approved', deviceId: 'd2' },
  { id: 'r3', code: 'RCP-CAM-001', name: 'Camera ROI standard', status: 'draft', deviceId: 'd3' },
]

const EQUIPMENT = [
  { id: 'd1', code: 'DEV-LEAK-001', name: 'Leak tester 1', level: 'device', class: 'leak_tester', status: 'available', plantId: 'p1' },
  { id: 'd2', code: 'DEV-LEAK-002', name: 'Leak tester 2', level: 'device', class: 'leak_tester', status: 'available', plantId: 'p1' },
  { id: 'd3', code: 'DEV-CAMERA-001', name: 'Camera 1', level: 'device', class: 'camera', status: 'available', plantId: 'p1' },
]

describe('RecipesTab', () => {
  it('renders the no-device EmptyState (kind="select") when selectedDeviceIds is empty', () => {
    recipesList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 })
    equipmentList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 })

    renderWithQuery(
      <RecipesTab
        selectedDeviceIds={[]}
        selectedRecipeId={null}
        onSelect={() => {}}
      />,
    )

    expect(
      document.querySelector('[data-resource-recipes-state="no-device"]'),
    ).not.toBeNull()
    expect(screen.getByText('Seleziona prima un dispositivo')).toBeInTheDocument()
    // Recipes API must NOT have been called when no device is selected (the
    // `enabled` flag on the useQuery is gated on selectedDeviceIds.length > 0).
    expect(recipesList).not.toHaveBeenCalled()
  })

  it('fetches recipes when ≥1 device is selected and filters client-side by deviceId IN selection', async () => {
    recipesList.mockResolvedValue({
      data: RECIPES,
      total: RECIPES.length,
      page: 1,
      limit: 200,
      totalPages: 1,
    })
    equipmentList.mockResolvedValue({
      data: EQUIPMENT,
      total: EQUIPMENT.length,
      page: 1,
      limit: 200,
      totalPages: 1,
    })

    renderWithQuery(
      <RecipesTab
        selectedDeviceIds={['d1', 'd3']}
        selectedRecipeId={null}
        onSelect={() => {}}
      />,
    )

    // Wait for queries to resolve and rows to render.
    await waitFor(() => {
      expect(document.querySelector('[data-resource-list="recipes"]')).not.toBeNull()
      expect(screen.getByText('RCP-LEAK-12-001')).toBeInTheDocument()
    })

    // r1 (d1) and r3 (d3) shown; r2 (d2) hidden.
    expect(screen.getByText('RCP-LEAK-12-001')).toBeInTheDocument()
    expect(screen.queryByText('RCP-LEAK-15-001')).toBeNull()
    expect(screen.getByText('RCP-CAM-001')).toBeInTheDocument()

    // Device-compat chip looked up via equipment query — DEV-LEAK-001 + DEV-CAMERA-001.
    const chips = document.querySelectorAll('[data-recipe-device-chip]')
    expect(chips).toHaveLength(2)
    expect(chips[0]?.textContent).toMatch(/DEV-LEAK-001/)
    expect(chips[1]?.textContent).toMatch(/DEV-CAMERA-001/)
  })
})
