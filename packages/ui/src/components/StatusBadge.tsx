import * as React from 'react'
import { cn } from '../utils/cn'

export type StatusTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'accent'

const STATUS_CLASSES: Record<StatusTone, { bg: string; dot: string; text: string }> = {
  ok: { bg: 'bg-ok-soft', dot: 'bg-ok', text: 'text-ok-ink' },
  warn: { bg: 'bg-warn-soft', dot: 'bg-warn', text: 'text-warn-ink' },
  bad: { bg: 'bg-bad-soft', dot: 'bg-bad', text: 'text-bad-ink' },
  info: { bg: 'bg-info-soft', dot: 'bg-info', text: 'text-info-ink' },
  neutral: { bg: 'bg-neutral-100', dot: 'bg-neutral-400', text: 'text-neutral-600' },
  accent: { bg: 'bg-accent-soft', dot: 'bg-accent', text: 'text-accent-ink' },
}

export type StatusValue =
  | 'draft'
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'partially_completed'
  | 'closed'
  | 'cancelled'
  | 'available'
  | 'reserved'
  | 'in_use'
  | 'maintenance'
  | 'broken'
  | 'offline'
  | 'empty'
  | 'partially_filled'
  | 'full'
  | 'sealed'
  | 'shipped'
  | 'returned'
  | 'in_cleaning'
  | 'damaged'
  | 'approved'
  | 'quarantine'
  | 'rejected'
  | 'active'
  | 'training'
  | 'on_leave'
  | 'inactive'
  | 'deprecated'

const STATUS_VALUE_MAP: Record<StatusValue, { tone: StatusTone; label: string }> = {
  draft: { tone: 'neutral', label: 'Draft' },
  planned: { tone: 'info', label: 'Planned' },
  released: { tone: 'info', label: 'Released' },
  in_progress: { tone: 'accent', label: 'In Progress' },
  on_hold: { tone: 'warn', label: 'On Hold' },
  completed: { tone: 'ok', label: 'Completed' },
  partially_completed: { tone: 'ok', label: 'Partial' },
  closed: { tone: 'ok', label: 'Closed' },
  cancelled: { tone: 'bad', label: 'Cancelled' },
  available: { tone: 'ok', label: 'Available' },
  reserved: { tone: 'info', label: 'Reserved' },
  in_use: { tone: 'warn', label: 'In Use' },
  maintenance: { tone: 'warn', label: 'Maintenance' },
  broken: { tone: 'bad', label: 'Broken' },
  offline: { tone: 'neutral', label: 'Offline' },
  empty: { tone: 'neutral', label: 'Empty' },
  partially_filled: { tone: 'info', label: 'Partial' },
  full: { tone: 'info', label: 'Full' },
  sealed: { tone: 'accent', label: 'Sealed' },
  shipped: { tone: 'ok', label: 'Shipped' },
  returned: { tone: 'warn', label: 'Returned' },
  in_cleaning: { tone: 'warn', label: 'Cleaning' },
  damaged: { tone: 'bad', label: 'Damaged' },
  approved: { tone: 'ok', label: 'Approved' },
  quarantine: { tone: 'warn', label: 'Quarantine' },
  rejected: { tone: 'bad', label: 'Rejected' },
  active: { tone: 'ok', label: 'Active' },
  training: { tone: 'info', label: 'Training' },
  on_leave: { tone: 'neutral', label: 'On Leave' },
  inactive: { tone: 'neutral', label: 'Inactive' },
  deprecated: { tone: 'neutral', label: 'Deprecated' },
}

const STATUS_TONE_SET: ReadonlySet<string> = new Set<StatusTone>([
  'ok',
  'warn',
  'bad',
  'info',
  'neutral',
  'accent',
])

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusTone | StatusValue | undefined
  tone?: StatusTone | undefined
  label?: string | undefined
}

function resolve({
  status,
  tone,
  label,
  children,
}: Pick<StatusBadgeProps, 'status' | 'tone' | 'label' | 'children'>): {
  tone: StatusTone
  content: React.ReactNode
} {
  if (status && status in STATUS_VALUE_MAP) {
    const mapped = STATUS_VALUE_MAP[status as StatusValue]
    return { tone: mapped.tone, content: children ?? label ?? mapped.label }
  }
  if (status && STATUS_TONE_SET.has(status)) {
    return { tone: status as StatusTone, content: children ?? label }
  }
  if (tone) {
    return { tone, content: children ?? label }
  }
  return { tone: 'neutral', content: children ?? label }
}

export function StatusBadge({
  status,
  tone,
  label,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const resolved = resolve({ status, tone, label, children })
  const c = STATUS_CLASSES[resolved.tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-sm font-medium',
        c.bg,
        c.text,
        className,
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {resolved.content}
    </span>
  )
}
