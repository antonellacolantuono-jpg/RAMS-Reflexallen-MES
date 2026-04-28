export enum HoldStatus {
  ACTIVE = 'active',
  RELEASED = 'released',
  REJECTED = 'rejected',
}

export enum HoldReason {
  QUALITY_ISSUE = 'quality_issue',
  DIMENSIONAL_NON_CONFORMANCE = 'dimensional_non_conformance',
  VISUAL_DEFECT = 'visual_defect',
  WRONG_MATERIAL = 'wrong_material',
  CONTAMINATION = 'contamination',
  PENDING_FAI = 'pending_fai',
  CUSTOMER_COMPLAINT = 'customer_complaint',
  OTHER = 'other',
}

export enum HoldActionType {
  RELEASE = 'release',
  REJECT = 'reject',
  ESCALATE = 'escalate',
  EXTEND = 'extend',
}
