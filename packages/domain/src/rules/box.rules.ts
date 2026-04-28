import type { BoxContext } from '../machines/box.machine'

export interface RuleResult {
  allowed: boolean
  reason?: string
}

export function canSeal(box: BoxContext): RuleResult {
  if (box.currentUnits === 0) {
    return { allowed: false, reason: 'Cannot seal an empty box' }
  }
  return { allowed: true }
}

export function canAddUnits(box: BoxContext, qty: number): RuleResult {
  if (qty <= 0) {
    return { allowed: false, reason: 'Quantity must be positive' }
  }
  if (box.currentUnits >= box.maxUnits) {
    return { allowed: false, reason: 'Box is already at capacity' }
  }
  return { allowed: true }
}

export function remainingCapacity(box: BoxContext): number {
  return Math.max(0, box.maxUnits - box.currentUnits)
}

export function fillRate(box: BoxContext): number {
  if (box.maxUnits === 0) return 0
  return box.currentUnits / box.maxUnits
}
