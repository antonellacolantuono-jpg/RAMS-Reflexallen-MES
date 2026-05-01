'use client'

import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'

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

interface WorkflowCanvasStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedNodeType: string | null
  isDirty: boolean
  history: { past: HistoryEntry[]; future: HistoryEntry[] }
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
}))
