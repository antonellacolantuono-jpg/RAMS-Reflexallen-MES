export enum WorkOrderStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  RELEASED = 'released',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum WorkOrderType {
  PRODUCTION = 'production',
  REWORK = 'rework',
  PROTOTYPE = 'prototype',
}

export enum AssignmentStatus {
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}
