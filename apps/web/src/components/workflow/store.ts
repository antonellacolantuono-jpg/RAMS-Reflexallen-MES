'use client'

import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'

type NodeUpdater = (updater: (nodes: Node[]) => Node[]) => void

interface WorkflowCanvasStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedNodeType: string | null
  isDirty: boolean
  // Callbacks registered by WorkflowCanvas so the configurator forms can
  // mutate the canvas's local React Flow state and trigger the auto-save
  // debounce without forms importing the canvas component.
  canvasSetNodes: NodeUpdater | null
  triggerAutoSave: (() => void) | null
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
  }) => void
  unregisterCanvasCallbacks: () => void
  // Used by configurator forms to patch a single node's data. Mutates both
  // the store's mirrored nodes and the canvas's local nodes via the
  // registered callback, then marks dirty and resets the auto-save timer.
  updateNodeData: (nodeId: string, partial: Record<string, unknown>) => void
}

export const useWorkflowStore = create<WorkflowCanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedNodeType: null,
  isDirty: false,
  canvasSetNodes: null,
  triggerAutoSave: null,
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
    set({ canvasSetNodes: cbs.setNodes, triggerAutoSave: cbs.triggerAutoSave }),
  unregisterCanvasCallbacks: () =>
    set({ canvasSetNodes: null, triggerAutoSave: null }),
  updateNodeData: (nodeId, partial) => {
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
}))
