import type { WorkOrderContext } from '../machines/work-order.machine.js'

export interface RuleResult {
  allowed: boolean
  reason?: string
}

export function canRelease(context: WorkOrderContext): RuleResult {
  if (!context.workOrderId) {
    return { allowed: false, reason: 'WorkOrder ID is required' }
  }
  if (context.qtyTarget <= 0) {
    return { allowed: false, reason: 'Target quantity must be positive' }
  }
  return { allowed: true }
}

export function canCancel(context: WorkOrderContext): RuleResult {
  if (context.qtyProduced > 0) {
    return {
      allowed: false,
      reason: 'Cannot cancel a work order with recorded production',
    }
  }
  return { allowed: true }
}

export function canComplete(context: WorkOrderContext): RuleResult {
  if (context.qtyProduced === 0) {
    return { allowed: false, reason: 'No production recorded' }
  }
  return { allowed: true }
}

export function isFullyCompleted(context: WorkOrderContext): boolean {
  return context.qtyProduced >= context.qtyTarget
}

export function completionRate(context: WorkOrderContext): number {
  if (context.qtyTarget === 0) return 0
  return Math.min(context.qtyProduced / context.qtyTarget, 1)
}
