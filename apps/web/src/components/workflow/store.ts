'use client'

import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import type { StepCategoryId, StepKindId } from '@mes/domain'

type NodeUpdater = (updater: (nodes: Node[]) => Node[]) => void

interface HistoryEntry {
  nodes: Node[]
  edges: Edge[]
}

const HISTORY_CAP = 50

function snapshot(nodes: Node[], edges: Edge[]): HistoryEntry {
  return {
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: edges.map((e) => ({ ...e })),
  }
}

export interface PaletteDragSource {
  source: 'category' | 'kind'
  id: string
}

export interface AddStepDialogState {
  open: boolean
  groupId: string | null
  preselectedKind: StepKindId | null
  preselectedCategory: StepCategoryId | null
}

export interface AddPhaseDrawerState {
  open: boolean
}

export interface AddGroupModalState {
  open: boolean
  phaseId: string | null
}

export interface ValidateDrawerState {
  open: boolean
}

interface WorkflowCanvasStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedNodeType: string | null
  isDirty: boolean
  history: { past: HistoryEntry[]; future: HistoryEntry[] }
  // Drag-drop state shared between palette and canvas group nodes (D2).
  dragSource: PaletteDragSource | null
  // Add Step shell dialog state (D2 — full shell, full content in PNE_1).
  addStepDialog: AddStepDialogState
  // Add Phase / Add Group / Validate dialog states (D5).
  addPhaseDrawer: AddPhaseDrawerState
  addGroupModal: AddGroupModalState
  validateDrawer: ValidateDrawerState
  // Callbacks registered by WorkflowCanvas so the configurator forms can
  // mutate the canvas's local React Flow state and trigger the auto-save
  // debounce without forms importing the canvas component.
  canvasSetNodes: NodeUpdater | null
  triggerAutoSave: (() => void) | null
  // Optional callback registered by the canvas so external panels (e.g.
  // ValidationPanel) can scroll the React Flow viewport to a given node.
  scrollToNode: ((nodeId: string) => void) | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  selectNode: (id: string | null, nodeType?: string | null) => void
  markDirty: () => void
  markClean: () => void
  registerCanvasCallbacks: (cbs: {
    setNodes: NodeUpdater
    triggerAutoSave: () => void
    scrollToNode: (nodeId: string) => void
  }) => void
  unregisterCanvasCallbacks: () => void
  // Used by configurator forms to patch a single node's data. Mutates both
  // the store's mirrored nodes and the canvas's local nodes via the
  // registered callback, then marks dirty and resets the auto-save timer.
  updateNodeData: (nodeId: string, partial: Record<string, unknown>) => void
  // History (PROMPT_3b Session B). Mutating actions push the previous state
  // to `past` (capped at 50). Undo/redo swap entries between past/future.
  pushHistory: () => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
  // Canvas mutations triggered by right-click menu / keyboard shortcuts.
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  // D2 drag-drop + Add Step dialog actions.
  setDragSource: (source: PaletteDragSource | null) => void
  openAddStepDialog: (params: {
    groupId: string
    preselectedKind?: StepKindId | null
    preselectedCategory?: StepCategoryId | null
  }) => void
  closeAddStepDialog: () => void
  // Append a new step node + group→step edge under the given group.
  // PROMPT_PNE_1 D4: extended payload — single-FK ids (skillId/deviceId/
  // recipeId/toolId) bake into node.data and persist via the existing
  // buildSavePayload + WorkflowStepInputSchema; multi-select arrays
  // (materialIds, attentionPointIds) and actionConfig are session-only and
  // sit in node.data only (TODO-040).
  addStepNodeToGroup: (
    groupId: string,
    payload: {
      label: string
      category: string
      kind?: string | null
      durationSec?: number | null
      instructions?: string | null
      skillId?: string | null
      deviceId?: string | null
      recipeId?: string | null
      toolId?: string | null
      materialIds?: string[]
      attentionPointIds?: string[]
      actionConfig?: Record<string, unknown>
    },
  ) => string
  // Append a new phase node (column) at the end + chain edge from previous.
  addPhaseNode: (payload: {
    label: string
    category: string
    isCycleBased: boolean
    tags?: string[]
  }) => string
  // Append a new group node under the given phase + chain edge from prev sibling.
  addGroupNodeToPhase: (
    phaseId: string,
    payload: {
      label: string
      category: string
      supportsParallel: boolean
      supportsRecovery: boolean
    },
  ) => string
  // D5 dialog actions.
  openAddPhaseDrawer: () => void
  closeAddPhaseDrawer: () => void
  openAddGroupModal: (phaseId: string) => void
  closeAddGroupModal: () => void
  openValidateDrawer: () => void
  closeValidateDrawer: () => void
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useWorkflowStore = create<WorkflowCanvasStore>((set, get) => ({
  nodes: [],
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
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  selectNode: (id, nodeType) =>
    set({ selectedNodeId: id, selectedNodeType: nodeType ?? null }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  registerCanvasCallbacks: (cbs) =>
    set({
      canvasSetNodes: cbs.setNodes,
      triggerAutoSave: cbs.triggerAutoSave,
      scrollToNode: cbs.scrollToNode,
    }),
  unregisterCanvasCallbacks: () =>
    set({ canvasSetNodes: null, triggerAutoSave: null, scrollToNode: null }),
  updateNodeData: (nodeId, partial) => {
    get().pushHistory()
    const updater = (nodes: Node[]) =>
      nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n,
      )
    set((state) => ({ nodes: updater(state.nodes), isDirty: true }))
    const cb = get().canvasSetNodes
    cb?.(updater)
    const trigger = get().triggerAutoSave
    trigger?.()
  },
  pushHistory: () => {
    const { nodes, edges, history } = get()
    const past = [...history.past, snapshot(nodes, edges)]
    if (past.length > HISTORY_CAP) past.shift()
    set({ history: { past, future: [] } })
  },
  undo: () => {
    const { nodes, edges, history, canvasSetNodes, triggerAutoSave } = get()
    if (history.past.length === 0) return
    const previous = history.past[history.past.length - 1]
    if (!previous) return
    const newPast = history.past.slice(0, -1)
    const newFuture = [snapshot(nodes, edges), ...history.future]
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      history: { past: newPast, future: newFuture },
      isDirty: true,
    })
    canvasSetNodes?.(() => previous.nodes)
    triggerAutoSave?.()
  },
  redo: () => {
    const { nodes, edges, history, canvasSetNodes, triggerAutoSave } = get()
    if (history.future.length === 0) return
    const next = history.future[0]
    if (!next) return
    const newFuture = history.future.slice(1)
    const newPast = [...history.past, snapshot(nodes, edges)]
    set({
      nodes: next.nodes,
      edges: next.edges,
      history: { past: newPast, future: newFuture },
      isDirty: true,
    })
    canvasSetNodes?.(() => next.nodes)
    triggerAutoSave?.()
  },
  clearHistory: () => set({ history: { past: [], future: [] } }),
  deleteNode: (nodeId) => {
    const { nodes, edges, canvasSetNodes, triggerAutoSave } = get()
    const target = nodes.find((n) => n.id === nodeId)
    if (!target) return
    get().pushHistory()
    // Cascade: also remove any node whose parentId points to the deleted one.
    const removedIds = new Set<string>([nodeId])
    let grew = true
    while (grew) {
      grew = false
      for (const n of nodes) {
        const parentId = n.data['parentId'] as string | undefined
        if (parentId && removedIds.has(parentId) && !removedIds.has(n.id)) {
          removedIds.add(n.id)
          grew = true
        }
      }
    }
    const updater = (ns: Node[]) => ns.filter((n) => !removedIds.has(n.id))
    const remainingEdges = edges.filter(
      (e) => !removedIds.has(e.source) && !removedIds.has(e.target),
    )
    set((state) => ({
      nodes: updater(state.nodes),
      edges: remainingEdges,
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      selectedNodeType: state.selectedNodeId === nodeId ? null : state.selectedNodeType,
      isDirty: true,
    }))
    canvasSetNodes?.(updater)
    triggerAutoSave?.()
  },
  duplicateNode: (nodeId) => {
    const { nodes, canvasSetNodes, triggerAutoSave } = get()
    const source = nodes.find((n) => n.id === nodeId)
    if (!source) return
    // Only step nodes are duplicable through the menu — phases/groups would
    // require recursive cloning of children plus order recomputation, which is
    // out of scope for the right-click menu.
    if (source.type !== 'stepNode') return
    get().pushHistory()
    const clone: Node = {
      ...source,
      id: newId(),
      position: {
        x: (source.position?.x ?? 0) + 40,
        y: (source.position?.y ?? 0) + 40,
      },
      data: { ...source.data },
      selected: false,
    }
    const updater = (ns: Node[]) => [...ns, clone]
    set((state) => ({ nodes: updater(state.nodes), isDirty: true }))
    canvasSetNodes?.(updater)
    triggerAutoSave?.()
  },
  setDragSource: (source) => set({ dragSource: source }),
  openAddStepDialog: ({ groupId, preselectedKind, preselectedCategory }) =>
    set({
      addStepDialog: {
        open: true,
        groupId,
        preselectedKind: preselectedKind ?? null,
        preselectedCategory: preselectedCategory ?? null,
      },
    }),
  closeAddStepDialog: () =>
    set({
      addStepDialog: {
        open: false,
        groupId: null,
        preselectedKind: null,
        preselectedCategory: null,
      },
    }),
  addStepNodeToGroup: (groupId, payload) => {
    const { nodes, edges, canvasSetNodes, triggerAutoSave } = get()
    const group = nodes.find((n) => n.id === groupId && n.type === 'groupNode')
    if (!group) return ''
    get().pushHistory()
    const id = newId()
    const order =
      nodes.filter(
        (n) => n.type === 'stepNode' && n.data['parentId'] === groupId,
      ).length + 1
    const groupX = group.position?.x ?? 0
    const groupY = group.position?.y ?? 0
    const newNode: Node = {
      id,
      type: 'stepNode',
      position: { x: groupX + 40, y: groupY + 80 + order * 60 },
      data: {
        label: payload.label,
        category: payload.category,
        order,
        parentId: groupId,
        ...(payload.kind ? { kind: payload.kind } : {}),
        // Write standardTimeSec (canonical key consumed by buildSavePayload +
        // WorkflowStepInputSchema). Mirror to durationSec for the inspector
        // forms that read it.
        ...(payload.durationSec != null
          ? {
              standardTimeSec: payload.durationSec,
              durationSec: payload.durationSec,
            }
          : {}),
        ...(payload.instructions ? { instructions: payload.instructions } : {}),
        // Single-FK ids (PROMPT_PNE_1 D4) — persisted via canvas auto-save.
        ...(payload.skillId ? { skillId: payload.skillId } : {}),
        ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
        ...(payload.recipeId ? { recipeId: payload.recipeId } : {}),
        ...(payload.toolId ? { toolId: payload.toolId } : {}),
        // Session-only multi-select arrays + action config (TODO-040).
        ...(payload.materialIds && payload.materialIds.length > 0
          ? { materialIds: payload.materialIds }
          : {}),
        ...(payload.attentionPointIds && payload.attentionPointIds.length > 0
          ? { attentionPointIds: payload.attentionPointIds }
          : {}),
        ...(payload.actionConfig
          ? { actionConfig: payload.actionConfig }
          : {}),
      },
    }
    const updater = (ns: Node[]) => [...ns, newNode]
    const newEdge: Edge = {
      id: `e-${groupId}-${id}`,
      source: groupId,
      target: id,
      type: 'sequential',
    }
    set({
      nodes: updater(nodes),
      edges: [...edges, newEdge],
      isDirty: true,
    })
    canvasSetNodes?.(updater)
    triggerAutoSave?.()
    return id
  },
  addPhaseNode: (payload) => {
    const { nodes, edges, canvasSetNodes, triggerAutoSave } = get()
    get().pushHistory()
    const id = newId()
    const phaseNodes = nodes.filter((n) => n.type === 'phaseNode')
    const order = phaseNodes.length + 1
    const newNode: Node = {
      id,
      type: 'phaseNode',
      position: { x: 0, y: 0 },
      data: {
        label: payload.label,
        category: payload.category,
        order,
        isCycleBased: payload.isCycleBased,
        ...(payload.tags && payload.tags.length > 0 ? { tags: payload.tags } : {}),
      },
    }
    const updater = (ns: Node[]) => [...ns, newNode]
    const lastPhase = phaseNodes.at(-1)
    const newEdges: Edge[] = lastPhase
      ? [
          {
            id: `e-${lastPhase.id}-${id}`,
            source: lastPhase.id,
            target: id,
            type: 'sequential',
          },
        ]
      : []
    set({
      nodes: updater(nodes),
      edges: [...edges, ...newEdges],
      isDirty: true,
    })
    canvasSetNodes?.(updater)
    triggerAutoSave?.()
    return id
  },
  openAddPhaseDrawer: () => set({ addPhaseDrawer: { open: true } }),
  closeAddPhaseDrawer: () => set({ addPhaseDrawer: { open: false } }),
  openAddGroupModal: (phaseId) => set({ addGroupModal: { open: true, phaseId } }),
  closeAddGroupModal: () => set({ addGroupModal: { open: false, phaseId: null } }),
  openValidateDrawer: () => set({ validateDrawer: { open: true } }),
  closeValidateDrawer: () => set({ validateDrawer: { open: false } }),
  addGroupNodeToPhase: (phaseId, payload) => {
    const { nodes, edges, canvasSetNodes, triggerAutoSave } = get()
    const phase = nodes.find((n) => n.id === phaseId && n.type === 'phaseNode')
    if (!phase) return ''
    get().pushHistory()
    const id = newId()
    const siblingGroups = nodes.filter(
      (n) => n.type === 'groupNode' && n.data['parentId'] === phaseId,
    )
    const order = siblingGroups.length + 1
    const newNode: Node = {
      id,
      type: 'groupNode',
      position: { x: 0, y: 0 },
      data: {
        label: payload.label,
        category: payload.category,
        order,
        parentId: phaseId,
        supportsParallel: payload.supportsParallel,
        supportsRecovery: payload.supportsRecovery,
      },
    }
    const updater = (ns: Node[]) => [...ns, newNode]
    const lastSibling = siblingGroups.at(-1)
    const sourceEdgeFrom = lastSibling?.id ?? phaseId
    const newEdge: Edge = {
      id: `e-${sourceEdgeFrom}-${id}`,
      source: sourceEdgeFrom,
      target: id,
      type: 'sequential',
    }
    set({
      nodes: updater(nodes),
      edges: [...edges, newEdge],
      isDirty: true,
    })
    canvasSetNodes?.(updater)
    triggerAutoSave?.()
    return id
  },
}))
