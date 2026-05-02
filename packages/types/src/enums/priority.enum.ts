export const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export type Priority = (typeof PRIORITIES)[number]

export const PRIORITY_LABELS_IT: Record<Priority, string> = {
  low: 'Bassa',
  normal: 'Normale',
  high: 'Alta',
  urgent: 'Urgente',
}
