import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@mes/ui'
import { AddStepDialog } from './AddStepDialog'
import { useWorkflowStore } from './store'

vi.mock('../../lib/sdk', () => ({
  sdk: {
    items: { list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 }) },
    tools: { list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 }) },
    equipment: { list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 }) },
  },
}))

function withProviders(node: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{node}</ToastProvider>
    </QueryClientProvider>
  )
}

function resetStore() {
  useWorkflowStore.setState({
    nodes: [
      {
        id: 'group-1',
        type: 'groupNode',
        position: { x: 0, y: 0 },
        data: { label: 'Esecuzione macchina', category: 'device_execution', order: 1 },
      },
    ],
    edges: [],
    selectedNodeId: null,
    selectedNodeType: null,
    isDirty: false,
    history: { past: [], future: [] },
    dragSource: null,
    addStepDialog: {
      open: false,
      groupId: null,
      preselectedKind: null,
      preselectedCategory: null,
    },
    canvasSetNodes: null,
    triggerAutoSave: null,
    scrollToNode: null,
  })
}

describe('AddStepDialog', () => {
  beforeEach(() => {
    resetStore()
  })

  it('does not render when closed and renders 3-column shell when opened', () => {
    const { rerender, container } = render(withProviders(<AddStepDialog />))

    // Closed by default — nothing rendered.
    expect(container.querySelector('[data-add-step-dialog="grid"]')).toBeNull()

    // Open via store action.
    act(() => {
      useWorkflowStore.getState().openAddStepDialog({
        groupId: 'group-1',
        preselectedKind: 'manual',
      })
    })
    rerender(withProviders(<AddStepDialog />))

    expect(screen.getByText('Aggiungi Step')).toBeInTheDocument()
    expect(screen.getByText('Step Kind')).toBeInTheDocument()
    expect(screen.getByText('Resource Selection')).toBeInTheDocument()
    expect(screen.getByText('Action Configuration')).toBeInTheDocument()

    // Footer must render BOTH cancel and primary submit buttons. Primary
    // must use the defined `bg-accent` token (not the unmapped
    // `bg-primary-600` which renders as white-on-white invisible).
    const cancel = screen.getByRole('button', { name: 'Annulla' })
    const submit = screen.getByRole('button', { name: 'Salva Step' })
    expect(cancel).toBeInTheDocument()
    expect(submit).toBeInTheDocument()
    expect(submit.className).toMatch(/bg-accent\b/)
    expect(submit.className).not.toMatch(/bg-primary-600/)

    // 3 panes by data-pane attribute.
    const grid = document.querySelector('[data-add-step-dialog="grid"]')
    expect(grid).not.toBeNull()
    expect(grid?.querySelectorAll('[data-pane]')).toHaveLength(3)

    // PROMPT_PNE_1 D1: ResourceTabs is mounted in the resources pane (replaces
    // the old "Selezione risorse — vedi PROMPT_PNE_1" placeholder). Materials
    // is the default-active tab.
    expect(
      document.querySelector('[data-resource-tabs="root"]'),
    ).not.toBeNull()
    expect(
      document.querySelector('[data-resource-tabs-content="materials"]'),
    ).not.toBeNull()
  })
})
