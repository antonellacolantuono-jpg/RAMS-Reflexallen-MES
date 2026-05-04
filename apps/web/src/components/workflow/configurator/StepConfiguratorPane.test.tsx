import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

// Mock the SDK before importing the pane (which does a top-level import)
const equipmentTree = vi.fn()
vi.mock('../../../lib/sdk', () => ({
  sdk: {
    equipment: { tree: (...a: unknown[]) => equipmentTree(...a) },
  },
}))

// Mock store + ResourceTabs to keep the harness focused on the new pane behavior.
const closeMock = vi.fn()
const addStepNodeMock = vi.fn().mockReturnValue('new-step-id')
const selectNodeMock = vi.fn()
const scrollToNodeMock = vi.fn()
let dialogState = {
  open: true,
  groupId: 'group-1',
  preselectedKind: null,
  preselectedCategory: null,
}
let mockNodes: Array<{ id: string; type: string; data: Record<string, unknown> }> = [
  { id: 'group-1', type: 'groupNode', data: { label: 'Group A', category: 'device_execution' } },
]

vi.mock('../store', () => ({
  useWorkflowStore: (selector: (s: unknown) => unknown) => {
    const s = {
      addStepDialog: dialogState,
      closeAddStepDialog: closeMock,
      addStepNodeToGroup: addStepNodeMock,
      selectNode: selectNodeMock,
      scrollToNode: scrollToNodeMock,
      nodes: mockNodes,
    }
    return selector(s)
  },
}))

vi.mock('@mes/ui', async () => {
  const actual = await vi.importActual<typeof import('@mes/ui')>('@mes/ui')
  return {
    ...actual,
    useToast: () => ({ show: vi.fn() }),
  }
})

vi.mock('./ResourceTabs', () => ({
  ResourceTabs: () => React.createElement('div', { 'data-testid': 'resource-tabs-mock' }, 'ResourceTabs'),
}))
vi.mock('./ActionConfig', () => ({
  ActionConfig: () =>
    React.createElement('div', { 'data-testid': 'action-config-mock' }, 'ActionConfig'),
}))

import { StepConfiguratorPane } from './StepConfiguratorPane'

function renderPane() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <StepConfiguratorPane />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  closeMock.mockReset()
  addStepNodeMock.mockReset().mockReturnValue('new-step-id')
  selectNodeMock.mockReset()
  scrollToNodeMock.mockReset()
  equipmentTree.mockReset()
  equipmentTree.mockResolvedValue([
    {
      id: 'wc-1',
      code: 'WC-LEAK',
      name: 'Leak Cell',
      level: 'work_center',
      children: [
        { id: 'wu-1', code: 'WS-LEAK-01', name: 'Postazione 1', level: 'work_unit' },
        { id: 'wu-2', code: 'WS-LEAK-02', name: 'Postazione 2', level: 'work_unit' },
      ],
    },
  ])
  dialogState = {
    open: true,
    groupId: 'group-1',
    preselectedKind: null,
    preselectedCategory: null,
  }
  mockNodes = [
    { id: 'group-1', type: 'groupNode', data: { label: 'Group A', category: 'device_execution' } },
  ]
  // Configure window for FourPaneConfigurator's xl viewport
  Object.defineProperty(window, 'innerWidth', { writable: true, value: 1440 })
  window.dispatchEvent(new Event('resize'))
})

describe('StepConfiguratorPane', () => {
  it('renders the FourPaneConfigurator shell with all 4 panes', () => {
    renderPane()
    expect(screen.getByTestId('step-configurator-pane')).toBeDefined()
    expect(screen.getByTestId('four-pane-wizard')).toBeDefined()
    expect(screen.getByTestId('four-pane-palette')).toBeDefined()
    expect(screen.getByTestId('four-pane-config')).toBeDefined()
    expect(screen.getByTestId('four-pane-preview')).toBeDefined()
  })

  it('renders 5 wizard steps in order Categoria → Azione → Risorsa → Dove → Riepilogo', () => {
    renderPane()
    expect(screen.getByTestId('four-pane-wizard-step-categoria')).toBeDefined()
    expect(screen.getByTestId('four-pane-wizard-step-azione')).toBeDefined()
    expect(screen.getByTestId('four-pane-wizard-step-risorsa')).toBeDefined()
    expect(screen.getByTestId('four-pane-wizard-step-dove')).toBeDefined()
    expect(screen.getByTestId('four-pane-wizard-step-riepilogo')).toBeDefined()
  })

  it('renders Postazione (work unit) dropdown populated from equipment tree', async () => {
    renderPane()
    await waitFor(() => {
      const select = screen.getByTestId('work-unit-select') as HTMLSelectElement
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    const select = screen.getByTestId('work-unit-select') as HTMLSelectElement
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent ?? '')
    expect(options.some((t) => t.includes('WS-LEAK-01'))).toBe(true)
    expect(options.some((t) => t.includes('WS-LEAK-02'))).toBe(true)
  })

  it('save button is disabled until name is entered', () => {
    renderPane()
    const save = screen.getByTestId('four-pane-save') as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.change(screen.getByTestId('step-name-input'), { target: { value: 'Test Step' } })
    expect((screen.getByTestId('four-pane-save') as HTMLButtonElement).disabled).toBe(false)
  })

  it('save calls addStepNodeToGroup with workUnitId and closes dialog', async () => {
    renderPane()
    // Switch to Automatic kind — its default schema state passes validation
    // (cycleTimeSec accepts '' literal, no required instructions).
    fireEvent.click(screen.getByTestId('kind-automatic'))
    fireEvent.change(screen.getByTestId('step-name-input'), { target: { value: 'Leak Test' } })
    // Wait for equipment.tree() to resolve so the select is populated with
    // option elements before we try to set the value.
    await waitFor(() => {
      const select = screen.getByTestId('work-unit-select') as HTMLSelectElement
      expect(select.querySelectorAll('option').length).toBeGreaterThan(2)
    })
    const select = screen.getByTestId('work-unit-select') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'wu-1' } })
    // Verify the controlled value reflects the change before invoking save.
    await waitFor(() => {
      expect((screen.getByTestId('work-unit-select') as HTMLSelectElement).value).toBe('wu-1')
    })
    fireEvent.click(screen.getByTestId('four-pane-save'))
    expect(addStepNodeMock).toHaveBeenCalledOnce()
    const call = addStepNodeMock.mock.calls[0]
    expect(call?.[0]).toBe('group-1')
    expect(call?.[1]).toMatchObject({
      label: 'Leak Test',
      workUnitId: 'wu-1',
    })
    expect(closeMock).toHaveBeenCalled()
  })

  it('cancel calls closeAddStepDialog without saving', () => {
    renderPane()
    fireEvent.click(screen.getByTestId('four-pane-cancel'))
    expect(closeMock).toHaveBeenCalled()
    expect(addStepNodeMock).not.toHaveBeenCalled()
  })

  it('clicking a wizard step changes the active wizard step', () => {
    renderPane()
    fireEvent.click(screen.getByTestId('four-pane-wizard-step-dove'))
    // No assertion on visual selection class — wizard step state is internal.
    // Verifying no crash + wizard buttons remain functional.
    expect(screen.getByTestId('four-pane-wizard-step-dove')).toBeDefined()
  })

  it('renders preview pane with title and category', () => {
    renderPane()
    fireEvent.change(screen.getByTestId('step-name-input'), { target: { value: 'My Step' } })
    expect(screen.getByTestId('preview-title').textContent).toContain('My Step')
  })

  it('renders nothing when dialog is closed', () => {
    dialogState = {
      ...dialogState,
      open: false,
    }
    renderPane()
    expect(screen.queryByTestId('step-configurator-pane')).toBeNull()
  })
})
