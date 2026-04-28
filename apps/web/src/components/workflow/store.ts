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
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  selectNode: (id: string | null) => void
}

export const useWorkflowStore = create<WorkflowCanvasStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  selectNode: (id) => set({ selectedNodeId: id }),
}))
