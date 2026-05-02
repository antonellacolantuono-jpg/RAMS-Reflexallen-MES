import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider } from '@mes/ui'
import { WorkflowInspector } from './WorkflowInspector'
import { useWorkflowStore } from './store'

function resetStore(selectedNodeId: string | null = null) {
  useWorkflowStore.setState({
    nodes: [
      {
        id: 'phase-1',
        type: 'phaseNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Setup',
          category: 'setup',
          order: 1,
          isCycleBased: false,
        },
      },
    ],
    edges: [],
    selectedNodeId,
    selectedNodeType: selectedNodeId ? 'phaseNode' : null,
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

describe('WorkflowInspector', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders the 3 tabs (Properties / Metadata / Audit) with Properties as the default', () => {
    resetStore('phase-1')
    const { container } = render(
      <ToastProvider>
        <WorkflowInspector />
      </ToastProvider>,
    )

    // Tablist with all 3 tabs.
    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Properties/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Metadata/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Audit/ })).toBeInTheDocument()

    // Default active tab is Properties — phase configurator content visible.
    // Metadata-only marker is not present.
    expect(container.querySelector('[data-tab-content="metadata"]')).toBeNull()
    expect(container.querySelector('[data-tab-content="audit"]')).toBeNull()

    // Click Metadata tab → metadata content swaps in.
    fireEvent.click(screen.getByRole('tab', { name: /Metadata/ }))
    expect(container.querySelector('[data-tab-content="metadata"]')).not.toBeNull()
    expect(container.querySelector('[data-tab-content="audit"]')).toBeNull()

    // Click Audit tab → audit content swaps in (EmptyState shown since stub returns []).
    fireEvent.click(screen.getByRole('tab', { name: /Audit/ }))
    expect(container.querySelector('[data-tab-content="audit"]')).not.toBeNull()
    expect(screen.getByText('Nessuna attività registrata')).toBeInTheDocument()
  })
})
