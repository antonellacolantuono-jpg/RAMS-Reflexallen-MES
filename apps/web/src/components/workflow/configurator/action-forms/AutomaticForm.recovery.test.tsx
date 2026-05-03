import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AutomaticForm } from './AutomaticForm'
import { defaultAutomatic } from '../../../../lib/step-validation-schemas'

// Mock the workflow store so the pre-retry candidates list resolves cleanly.
vi.mock('../../store', () => ({
  useWorkflowStore: (selector: (s: unknown) => unknown) =>
    selector({
      nodes: [
        {
          id: 'node-pre-1',
          type: 'stepNode',
          data: { label: 'Verifica connessione tubi' },
        },
        {
          id: 'node-pre-2',
          type: 'stepNode',
          data: { label: 'Reset pressione' },
        },
      ],
    }),
}))

function renderForm(value = defaultAutomatic) {
  const onChange = vi.fn()
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const utils = render(
    <QueryClientProvider client={qc}>
      <AutomaticForm
        value={value}
        onChange={onChange}
        selectedDeviceIds={[]}
        selectedRecipeId={null}
      />
    </QueryClientProvider>,
  )
  return { onChange, ...utils }
}

describe('AutomaticForm — recovery section', () => {
  it('renders the recovery section collapsed; toggling enabled reveals max attempts + pre-retry list', () => {
    renderForm()

    // Recovery checkbox present, max attempts hidden until enabled.
    const enableCheckbox = screen.getByTestId('recovery-enabled')
    expect(enableCheckbox).toBeInTheDocument()
    expect(screen.queryByTestId('recovery-max-attempts')).not.toBeInTheDocument()

    fireEvent.click(enableCheckbox)

    expect(screen.getByTestId('recovery-max-attempts')).toBeInTheDocument()
    const list = screen.getByTestId('recovery-pre-retry-list')
    expect(list).toHaveTextContent('Verifica connessione tubi')
    expect(list).toHaveTextContent('Reset pressione')
  })
})
