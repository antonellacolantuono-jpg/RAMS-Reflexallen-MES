export type LotQualityStatus = 'pending' | 'approved' | 'quarantine' | 'rejected'

export interface LotContext {
  lotId: string
  qualityStatus: LotQualityStatus
  qty: number
  expiresAt: string | null
}

export interface RuleResult {
  allowed: boolean
  reason?: string
}

export function canApprove(lot: LotContext): RuleResult {
  if (lot.qualityStatus === 'rejected') {
    return { allowed: false, reason: 'Rejected lot cannot be approved' }
  }
  if (lot.expiresAt && new Date(lot.expiresAt) < new Date()) {
    return { allowed: false, reason: 'Lot has expired' }
  }
  return { allowed: true }
}

export function canQuarantine(lot: LotContext): RuleResult {
  if (lot.qualityStatus === 'rejected') {
    return { allowed: false, reason: 'Rejected lot cannot be quarantined' }
  }
  return { allowed: true }
}

export function canReject(lot: LotContext): RuleResult {
  if (lot.qty === 0) {
    return { allowed: false, reason: 'Empty lot cannot be rejected' }
  }
  return { allowed: true }
}

export function isUsable(lot: LotContext): boolean {
  if (lot.qualityStatus !== 'approved') return false
  if (lot.expiresAt && new Date(lot.expiresAt) < new Date()) return false
  return lot.qty > 0
}
