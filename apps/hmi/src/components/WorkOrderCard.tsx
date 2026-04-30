'use client'
import * as React from 'react'
import { Badge, Progress, Button } from '@mes/ui'
import type { MockWorkOrder } from '../lib/mock-data'

const PRIORITY_LABEL: Record<MockWorkOrder['priority'], string> = {
  high: 'Alta',
  normal: 'Normale',
  low: 'Bassa',
}

const PRIORITY_TONE: Record<
  MockWorkOrder['priority'],
  'bad' | 'accent' | 'neutral'
> = {
  high: 'bad',
  normal: 'accent',
  low: 'neutral',
}

interface WorkOrderCardProps {
  workOrder: MockWorkOrder
  onOpen: (id: string) => void
}

export function WorkOrderCard({ workOrder, onOpen }: WorkOrderCardProps) {
  const isStarted = workOrder.status === 'in_progress'
  const cta = isStarted ? 'Continua →' : 'Inizia →'
  return (
    <div
      className="glass rounded-3 p-5 flex flex-col gap-4 min-h-[180px]"
      data-testid={`wo-card-${workOrder.code}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-ink-3">
            {workOrder.code}
          </span>
          <h3 className="text-lg font-semibold text-ink leading-tight">
            {workOrder.itemName}
          </h3>
          <span className="text-sm text-ink-2">{workOrder.itemCode}</span>
        </div>
        <Badge tone={PRIORITY_TONE[workOrder.priority]} dot>
          {PRIORITY_LABEL[workOrder.priority]}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm text-ink-2">
          <span>Progresso</span>
          <span className="tabular-nums font-medium text-ink">
            {workOrder.completed} / {workOrder.quantity}
          </span>
        </div>
        <Progress
          value={workOrder.completed}
          max={workOrder.quantity}
          tone="accent"
        />
      </div>

      <Button
        size="hmi"
        className="w-full mt-auto"
        onClick={() => onOpen(workOrder.id)}
      >
        {cta}
      </Button>
    </div>
  )
}
