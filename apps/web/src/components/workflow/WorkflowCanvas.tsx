'use client'

import { useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowModel } from '@mes/sdk'
import { useWorkflowStore } from './store'
import { applyDagreLayout } from './layout'
import { PhaseNode } from './nodes/PhaseNode'
import { GroupNode } from './nodes/GroupNode'
import { StepNode } from './nodes/StepNode'
import { SequentialEdge } from './edges/SequentialEdge'

const nodeTypes = {
  phaseNode: PhaseNode,
  groupNode: GroupNode,
  stepNode: StepNode,
}

const edgeTypes = {
  sequential: SequentialEdge,
}

function buildGraph(workflow: WorkflowModel): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const phases = workflow.currentVersion?.phases ?? []

  phases.forEach((phase, phaseIdx) => {
    nodes.push({
      id: phase.id,
      type: 'phaseNode',
      position: { x: 0, y: 0 },
      data: { label: phase.name, category: phase.category, order: phase.order },
    })

    if (phaseIdx > 0) {
      const prev = phases[phaseIdx - 1]
      if (prev) {
        edges.push({ id: `e-${prev.id}-${phase.id}`, source: prev.id, target: phase.id, type: 'sequential' })
      }
    }

    phase.groups.forEach((group, groupIdx) => {
      nodes.push({
        id: group.id,
        type: 'groupNode',
        position: { x: 0, y: 0 },
        data: { label: group.name, category: group.category, order: group.order },
      })

      if (groupIdx === 0) {
        edges.push({ id: `e-${phase.id}-${group.id}`, source: phase.id, target: group.id, type: 'sequential' })
      } else {
        const prev = phase.groups[groupIdx - 1]
        if (prev) {
          edges.push({ id: `e-${prev.id}-${group.id}`, source: prev.id, target: group.id, type: 'sequential' })
        }
      }

      group.steps.forEach((step, stepIdx) => {
        nodes.push({
          id: step.id,
          type: 'stepNode',
          position: { x: 0, y: 0 },
          data: {
            label: step.name,
            category: step.category,
            source: step.source,
            standardTimeSec: step.standardTimeSec ?? null,
            order: step.order,
          },
        })

        if (stepIdx === 0) {
          edges.push({ id: `e-${group.id}-${step.id}`, source: group.id, target: step.id, type: 'sequential' })
        } else {
          const prev = group.steps[stepIdx - 1]
          if (prev) {
            edges.push({ id: `e-${prev.id}-${step.id}`, source: prev.id, target: step.id, type: 'sequential' })
          }
        }
      })
    })
  })

  return { nodes, edges }
}

function CanvasInner({ workflow }: { workflow: WorkflowModel }) {
  const { selectNode } = useWorkflowStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildGraph(workflow)
    const laid = applyDagreLayout(rawNodes, rawEdges)
    setNodes(laid)
    setEdges(rawEdges)
  }, [workflow, setNodes, setEdges])

  const isEmpty = nodes.length === 0

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => selectNode(node.id)}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-neutral-400 text-xs text-center">
            Nessun nodo — trascina elementi dalla palette (D5)
          </p>
        </div>
      )}
    </div>
  )
}

export function WorkflowCanvas({ workflow }: { workflow: WorkflowModel }) {
  return (
    <ReactFlowProvider>
      <CanvasInner workflow={workflow} />
    </ReactFlowProvider>
  )
}
