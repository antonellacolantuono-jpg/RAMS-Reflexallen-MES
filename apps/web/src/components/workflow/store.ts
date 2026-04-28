'use client'

import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'

interface WorkflowCanvasStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedNodeType: string | null
  isDirty: boolean
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  selectNode: (id: string | null, nodeType?: string | null) => void
  markDirty: () => void
  markClean: () => void
}

export const useWorkflowStore = create<WorkflowCanvasStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedNodeType: null,
  isDirty: false,
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
}))
