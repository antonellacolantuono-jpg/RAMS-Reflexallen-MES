import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider } from '@mes/ui'
import { AddStepDialog } from './AddStepDialog'
import { useWorkflowStore } from './store'

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
    const { rerender, container } = render(
      <ToastProvider>
        <AddStepDialog />
      </ToastProvider>,
    )

    // Closed by default — nothing rendered.
    expect(container.querySelector('[data-add-step-dialog="grid"]')).toBeNull()

    // Open via store action.
    act(() => {
      useWorkflowStore.getState().openAddStepDialog({
        groupId: 'group-1',
        preselectedKind: 'manual',
      })
    })
    rerender(
      <ToastProvider>
        <AddStepDialog />
      </ToastProvider>,
    )

    expect(screen.getByText('Aggiungi Step')).toBeInTheDocument()
    expect(screen.getByText('Step Kind')).toBeInTheDocument()
    expect(screen.getByText('Resource Selection')).toBeInTheDocument()
    expect(screen.getByText('Action Configuration')).toBeInTheDocument()

    // 3 panes by data-pane attribute.
    const grid = document.querySelector('[data-add-step-dialog="grid"]')
    expect(grid).not.toBeNull()
    expect(grid?.querySelectorAll('[data-pane]')).toHaveLength(3)

    // Resource tabs placeholder references PROMPT_PNE_1.
    expect(
      screen.getByText('Selezione risorse — vedi PROMPT_PNE_1'),
    ).toBeInTheDocument()
  })
})
