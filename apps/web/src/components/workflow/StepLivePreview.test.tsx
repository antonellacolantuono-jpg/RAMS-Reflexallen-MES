import { afterEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Node } from '@xyflow/react'
import { StepLivePreview } from './StepLivePreview'
import { useWorkflowStore } from './store'

function resetStore() {
  useWorkflowStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedNodeType: null,
  })
}

function seedStepNode(overrides: Partial<Node> = {}): Node {
  const node: Node = {
    id: 'step-leak',
    type: 'stepNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test di tenuta camera',
      category: 'quality_control',
      actionType: 'functional_test',
      instructions: 'Avvia il test di tenuta a 6 bar.',
    },
    ...overrides,
  }
  useWorkflowStore.setState({
    nodes: [node],
    selectedNodeId: node.id,
    selectedNodeType: node.type ?? null,
  })
  return node
}

afterEach(() => {
  resetStore()
})

describe('StepLivePreview — empty states', () => {
  it('renders an empty-state hint when nothing is selected', () => {
    resetStore()
    render(<StepLivePreview />)
    expect(
      screen.getByText(
        /Seleziona uno step nel canvas per vedere come apparirà/,
      ),
    ).toBeDefined()
  })

  it('renders the same hint when the selected node is not a step', () => {
    useWorkflowStore.setState({
      nodes: [
        {
          id: 'phase-1',
          type: 'phaseNode',
          position: { x: 0, y: 0 },
          data: { label: 'Setup' },
        },
      ],
      selectedNodeId: 'phase-1',
      selectedNodeType: 'phaseNode',
    })
    render(<StepLivePreview />)
    expect(
      screen.getByText(
        /Seleziona uno step nel canvas per vedere come apparirà/,
      ),
    ).toBeDefined()
  })
})

describe('StepLivePreview — chip-driven state transitions', () => {
  it('renders the selected step name and 11 chips in two groups', () => {
    seedStepNode()
    const { container } = render(<StepLivePreview />)

    expect(screen.getByText('Test di tenuta camera')).toBeDefined()

    const okGroup = container.querySelector('[data-chip-group="ok"]')
    const koGroup = container.querySelector('[data-chip-group="ko"]')
    expect(okGroup?.querySelectorAll('button').length).toBe(6)
    expect(koGroup?.querySelectorAll('button').length).toBe(5)
  })

  it('starts in idle and transitions when a chip is clicked', () => {
    seedStepNode()
    const { container } = render(<StepLivePreview />)

    const card = () =>
      container.querySelector('[data-testid="live-preview-step-card"]')

    expect(card()?.getAttribute('data-state')).toBe('idle')

    fireEvent.click(screen.getByText('In corso'))
    expect(card()?.getAttribute('data-state')).toBe('in_progress')
    expect(card()?.getAttribute('data-status')).toBe('running')

    fireEvent.click(screen.getByText('Errore'))
    expect(card()?.getAttribute('data-state')).toBe('error')
    expect(card()?.getAttribute('data-status')).toBe('error')
  })

  it('Reset button returns the preview to idle', () => {
    seedStepNode()
    const { container } = render(<StepLivePreview />)

    fireEvent.click(screen.getByText('Completato'))
    const card = container.querySelector(
      '[data-testid="live-preview-step-card"]',
    )
    expect(card?.getAttribute('data-state')).toBe('complete')

    fireEvent.click(screen.getByTestId('live-preview-reset'))
    expect(
      container
        .querySelector('[data-testid="live-preview-step-card"]')
        ?.getAttribute('data-state'),
    ).toBe('idle')
  })

  it('updates when the inspector form mutates node data via updateNodeData', () => {
    seedStepNode()
    render(<StepLivePreview />)

    expect(screen.getByText('Test di tenuta camera')).toBeDefined()

    // Simulate the inspector form's onBlur path: call updateNodeData directly
    // (the same store action ProductionStepForm + co. use). Without a canvas
    // mounted there are no canvas callbacks registered, but the store's own
    // node mirror still mutates — wrapped in act() so React flushes the
    // Zustand-triggered re-render before we assert.
    act(() => {
      useWorkflowStore.getState().updateNodeData('step-leak', {
        label: 'Test di tenuta camera (rev. B)',
      })
    })

    expect(screen.getByText('Test di tenuta camera (rev. B)')).toBeDefined()
  })
})
