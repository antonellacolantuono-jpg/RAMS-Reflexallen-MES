import { describe, it, expect, beforeEach } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import type { Node } from '@xyflow/react'
import { useWorkflowStore } from './store'
import { DeleteNodeDialog } from './DeleteNodeDialog'

function makeNode(id: string, type: string, label: string, parentId?: string): Node {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label, ...(parentId ? { parentId } : {}) },
  } as Node
}

beforeEach(() => {
  // Reset the store to a known shape — fresh nodes/edges and a clean confirm slice.
  useWorkflowStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedNodeType: null,
    isDirty: false,
    deleteConfirm: { open: false, nodeId: null, kind: null },
  })
})

describe('DeleteNodeDialog', () => {
  it('renders nothing visible when the confirm slice is closed', () => {
    render(<DeleteNodeDialog />)
    expect(screen.queryByText(/Elimina/)).not.toBeInTheDocument()
  })

  it('renders the cascade warning when deleting a phase that has groups + steps', () => {
    useWorkflowStore.setState({
      nodes: [
        makeNode('p1', 'phaseNode', 'Setup'),
        makeNode('g1', 'groupNode', 'Skills check', 'p1'),
        makeNode('g2', 'groupNode', 'BoM check', 'p1'),
        makeNode('s1', 'stepNode', 'Verify operator', 'g1'),
        makeNode('s2', 'stepNode', 'Verify lot', 'g2'),
        makeNode('s3', 'stepNode', 'Verify tool', 'g2'),
      ],
    })
    act(() => {
      useWorkflowStore.getState().openDeleteConfirm('p1', 'phaseNode')
    })
    render(<DeleteNodeDialog />)

    expect(screen.getByText('Elimina fase')).toBeInTheDocument()
    const desc = screen.getByText(/Sei sicuro di voler eliminare la fase "Setup"/)
    expect(desc).toBeInTheDocument()
    expect(desc.textContent).toContain('Verranno eliminati anche 2 gruppi e 3 step contenuti.')
  })

  it('omits the cascade warning when deleting a leaf step', () => {
    useWorkflowStore.setState({
      nodes: [makeNode('s1', 'stepNode', 'Misura LT', 'g1')],
    })
    act(() => {
      useWorkflowStore.getState().openDeleteConfirm('s1', 'stepNode')
    })
    render(<DeleteNodeDialog />)

    const desc = screen.getByText(/Sei sicuro di voler eliminare lo step "Misura LT"/)
    expect(desc.textContent).not.toMatch(/Verranno eliminati anche/)
  })

  it('confirm calls deleteNode + closes the dialog; cancel closes without deleting', () => {
    useWorkflowStore.setState({
      nodes: [
        makeNode('g1', 'groupNode', 'QC ispezione'),
        makeNode('s1', 'stepNode', 'Misura', 'g1'),
      ],
    })
    act(() => {
      useWorkflowStore.getState().openDeleteConfirm('g1', 'groupNode')
    })
    const { unmount } = render(<DeleteNodeDialog />)

    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }))
    const stateAfterConfirm = useWorkflowStore.getState()
    expect(stateAfterConfirm.deleteConfirm.open).toBe(false)
    expect(stateAfterConfirm.nodes.find((n) => n.id === 'g1')).toBeUndefined()
    // Cascade — the orphan step should also be gone.
    expect(stateAfterConfirm.nodes.find((n) => n.id === 's1')).toBeUndefined()

    unmount()

    // Re-open and cancel — node count should stay unchanged this time.
    useWorkflowStore.setState({
      nodes: [
        makeNode('g2', 'groupNode', 'Logistica'),
        makeNode('s2', 'stepNode', 'Stampa', 'g2'),
      ],
    })
    act(() => {
      useWorkflowStore.getState().openDeleteConfirm('g2', 'groupNode')
    })
    render(<DeleteNodeDialog />)

    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }))
    const stateAfterCancel = useWorkflowStore.getState()
    expect(stateAfterCancel.deleteConfirm.open).toBe(false)
    expect(stateAfterCancel.nodes.find((n) => n.id === 'g2')).toBeDefined()
    expect(stateAfterCancel.nodes.find((n) => n.id === 's2')).toBeDefined()
  })
})
