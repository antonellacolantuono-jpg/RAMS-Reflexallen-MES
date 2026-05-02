import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AutomaticForm } from './AutomaticForm'
import { defaultAutomatic } from '../../../../lib/step-validation-schemas'

const recipeGet = vi.fn()
const workflowsList = vi.fn()

vi.mock('../../../../lib/sdk', () => ({
  sdk: {
    recipes: { get: (...args: unknown[]) => recipeGet(...args) },
    workflows: { list: (...args: unknown[]) => workflowsList(...args) },
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('AutomaticForm', () => {
  it('disables Device and Recipe readonly inputs with help text when no resource selection is present', () => {
    workflowsList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 })

    renderWithQuery(
      <AutomaticForm
        value={defaultAutomatic}
        onChange={() => {}}
        selectedDeviceIds={[]}
        selectedRecipeId={null}
      />,
    )

    const deviceInput = document.querySelector(
      'input[data-automatic-device-readonly]',
    ) as HTMLInputElement | null
    const recipeInput = document.querySelector(
      'input[data-automatic-recipe-readonly]',
    ) as HTMLInputElement | null

    expect(deviceInput).not.toBeNull()
    expect(deviceInput!.disabled).toBe(true)
    expect(deviceInput!.readOnly).toBe(true)

    expect(recipeInput).not.toBeNull()
    expect(recipeInput!.disabled).toBe(true)
    expect(recipeInput!.readOnly).toBe(true)

    // Help text surfaces the call-to-action ("Seleziona un dispositivo nella tab Risorse").
    expect(
      screen.getByText('Seleziona un dispositivo nella tab Risorse'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Seleziona una ricetta nella tab Risorse'),
    ).toBeInTheDocument()
  })

  it('auto-fills cycleTimeSec from the selected recipe parameters when value is empty', async () => {
    recipeGet.mockResolvedValue({
      id: 'r1',
      code: 'RCP-LEAK-001',
      name: 'Standard',
      status: 'approved',
      deviceId: 'd1',
      plantId: 'p1',
      parameters: [
        { key: 'pressure_mbar', value: 100, type: 'numeric' },
        { key: 'cycleTimeSec', value: 45, type: 'numeric' },
      ],
      createdAt: '', updatedAt: '', version: 1, createdBy: '', updatedBy: '',
    })
    workflowsList.mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 })

    renderWithQuery(
      <AutomaticForm
        value={{ ...defaultAutomatic, cycleTimeSec: '' }}
        onChange={() => {}}
        selectedDeviceIds={['d1']}
        selectedRecipeId="r1"
      />,
    )

    const cycleInput = document.querySelector(
      'input[data-automatic-cycle-time]',
    ) as HTMLInputElement | null
    expect(cycleInput).not.toBeNull()

    // Initially empty; after recipe resolves, react-hook-form updates the
    // controlled value to 45 (from recipe.parameters[cycleTimeSec]).
    await waitFor(() => {
      expect(cycleInput!.value).toBe('45')
    })
    expect(recipeGet).toHaveBeenCalledWith('r1')
  })
})
