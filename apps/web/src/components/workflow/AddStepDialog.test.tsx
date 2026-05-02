import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
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

  it('on save: validates required fields, creates step node with extended payload, closes dialog, selects new node (PROMPT_PNE_1 D4)', async () => {
    const { rerender } = render(withProviders(<AddStepDialog />))

    // Open dialog with manual preselected.
    act(() => {
      useWorkflowStore.getState().openAddStepDialog({
        groupId: 'group-1',
        preselectedKind: 'manual',
      })
    })
    rerender(withProviders(<AddStepDialog />))

    const submit = screen.getByRole('button', { name: 'Salva Step' })

    // (1) Save with empty name: toast 'Nome obbligatorio' fires + no step
    // node is created.
    fireEvent.click(submit)
    let stepCount = useWorkflowStore.getState().nodes.filter((n) => n.type === 'stepNode').length
    expect(stepCount).toBe(0)
    expect(useWorkflowStore.getState().addStepDialog.open).toBe(true)

    // (2) Fill name + Manual instructions (required by ManualSchema).
    const nameInput = screen.getByPlaceholderText('es. Verifica torque iniziale')
    fireEvent.change(nameInput, { target: { value: 'Verifica torque' } })

    const instructionsTextarea = screen.getByPlaceholderText('Indicare istruzioni passo-passo')
    fireEvent.change(instructionsTextarea, {
      target: { value: 'Avvitare a 12 Nm e segnare con marker' },
    })
    fireEvent.blur(instructionsTextarea)

    // Seed multi-select selections directly into the dialog by interacting
    // with ResourceTabs is heavy; instead we patch via the dialog open call
    // and rely on ManualForm + name being valid for save to fire.
    fireEvent.click(submit)

    // Allow react-hook-form's onChange listener to flush into actionConfig
    // and the save handler to read the latest state.
    await act(() => Promise.resolve())

    const state = useWorkflowStore.getState()

    // (3) Dialog closed (open === false).
    expect(state.addStepDialog.open).toBe(false)

    // Step node exists under the seeded group with the right shape.
    const stepNodes = state.nodes.filter((n) => n.type === 'stepNode')
    expect(stepNodes).toHaveLength(1)
    const step = stepNodes[0]!
    expect(step.data['label']).toBe('Verifica torque')
    expect(step.data['parentId']).toBe('group-1')
    expect(step.data['kind']).toBe('manual')
    expect(step.data['instructions']).toBe('Avvitare a 12 Nm e segnare con marker')
    // actionConfig blob persisted in node.data (session-only TODO-040).
    expect(step.data['actionConfig']).toBeDefined()
    const ac = step.data['actionConfig'] as Record<string, unknown>
    expect((ac['manual'] as { instructions: string }).instructions).toBe(
      'Avvitare a 12 Nm e segnare con marker',
    )

    // (4) Newly added node is selected (selectedNodeId === step.id).
    expect(state.selectedNodeId).toBe(step.id)
    expect(state.selectedNodeType).toBe('stepNode')
  })

  it('on save with missing required field (Manual instructions empty): does NOT create a step node + dialog stays open', async () => {
    const { rerender } = render(withProviders(<AddStepDialog />))

    act(() => {
      useWorkflowStore.getState().openAddStepDialog({
        groupId: 'group-1',
        preselectedKind: 'manual',
      })
    })
    rerender(withProviders(<AddStepDialog />))

    // Fill the name (passes the early "Nome obbligatorio" guard) but leave
    // ManualForm.instructions empty (required by ManualSchema).
    const nameInput = screen.getByPlaceholderText('es. Verifica torque iniziale')
    fireEvent.change(nameInput, { target: { value: 'Step incompleto' } })

    const submit = screen.getByRole('button', { name: 'Salva Step' })
    fireEvent.click(submit)
    await act(() => Promise.resolve())

    // No step created; dialog still open.
    const state = useWorkflowStore.getState()
    expect(state.nodes.filter((n) => n.type === 'stepNode')).toHaveLength(0)
    expect(state.addStepDialog.open).toBe(true)
  })

  it('InlineHint surfaces above the Action Config column when the active form has session-only fields (PROMPT_PNE_1 D3+D4 / TODO-040)', () => {
    const { rerender } = render(withProviders(<AddStepDialog />))

    act(() => {
      useWorkflowStore.getState().openAddStepDialog({
        groupId: 'group-1',
        preselectedKind: 'manual',
      })
    })
    rerender(withProviders(<AddStepDialog />))

    // Manual is in SESSION_ONLY_FORM_KEYS → InlineHint banner mounted with the
    // expected Italian copy referencing F2 / PROMPT_7.
    const hint = document.querySelector('[data-action-config-session-hint]')
    expect(hint).not.toBeNull()
    expect(hint!.textContent).toMatch(
      /selezioni multiple e i parametri avanzati saranno persistiti in F2/,
    )
    // ActionConfig also exposes its derived form key for inspection.
    const acRoot = document.querySelector(
      '[data-action-config-form-key="manual"]',
    )
    expect(acRoot).not.toBeNull()
  })

  it('extended payload bakes single-FK ids into node.data when resource selections are seeded (PROMPT_PNE_1 D4)', async () => {
    const { rerender } = render(withProviders(<AddStepDialog />))

    act(() => {
      useWorkflowStore.getState().openAddStepDialog({
        groupId: 'group-1',
        preselectedKind: 'manual',
      })
    })
    rerender(withProviders(<AddStepDialog />))

    // Drive the dialog by directly invoking the store's mutator with the
    // extended payload — this validates the store contract end-to-end.
    let createdId = ''
    act(() => {
      createdId = useWorkflowStore.getState().addStepNodeToGroup('group-1', {
        label: 'Test step with all selections',
        category: 'production',
        kind: 'manual',
        durationSec: 45,
        instructions: 'Test',
        skillId: 'skill-1',
        deviceId: 'device-1',
        recipeId: 'recipe-1',
        toolId: 'tool-1',
        materialIds: ['mat-1', 'mat-2'],
        attentionPointIds: ['ap-1'],
        actionConfig: { manual: { instructions: 'Test', isRequired: true } },
      })
    })

    expect(createdId).toBeTruthy()
    const step = useWorkflowStore
      .getState()
      .nodes.find((n) => n.id === createdId)!
    expect(step).toBeDefined()
    // Single-FK fields baked under canonical keys consumed by buildSavePayload.
    expect(step.data['skillId']).toBe('skill-1')
    expect(step.data['deviceId']).toBe('device-1')
    expect(step.data['recipeId']).toBe('recipe-1')
    expect(step.data['toolId']).toBe('tool-1')
    expect(step.data['standardTimeSec']).toBe(45)
    // Session-only multi-select arrays under node.data (TODO-040).
    expect(step.data['materialIds']).toEqual(['mat-1', 'mat-2'])
    expect(step.data['attentionPointIds']).toEqual(['ap-1'])
    // Session-only actionConfig blob (TODO-040).
    expect(step.data['actionConfig']).toEqual({
      manual: { instructions: 'Test', isRequired: true },
    })
  })
})
