import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider } from '@mes/ui'
import { AddGroupModal } from './AddGroupModal'
import { useWorkflowStore } from './store'

function resetStore() {
  useWorkflowStore.setState({
    nodes: [
      {
        id: 'phase-1',
        type: 'phaseNode',
        position: { x: 0, y: 0 },
        data: { label: 'Production', category: 'production', order: 1 },
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
    addPhaseDrawer: { open: false },
    addGroupModal: { open: false, phaseId: null },
    validateDrawer: { open: false },
    canvasSetNodes: null,
    triggerAutoSave: null,
    scrollToNode: null,
  })
}

describe('AddGroupModal', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders both Annulla and Aggiungi Gruppo footer buttons when open, primary uses bg-accent token', () => {
    render(
      <ToastProvider>
        <AddGroupModal open onClose={() => {}} phaseId="phase-1" />
      </ToastProvider>,
    )

    const cancel = screen.getByRole('button', { name: 'Annulla' })
    const submit = screen.getByRole('button', { name: 'Aggiungi Gruppo' })

    expect(cancel).toBeInTheDocument()
    expect(submit).toBeInTheDocument()
    expect(submit.className).toMatch(/bg-accent\b/)
    expect(submit.className).not.toMatch(/bg-primary-600/)
    expect(submit).not.toBeDisabled()
  })
})
