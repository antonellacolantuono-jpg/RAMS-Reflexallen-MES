export * from './machines/index'

// RuleResult is identical across all rules files — export once
export type { RuleResult } from './rules/work-order.rules'

// work-order rules
export {
  canRelease,
  canCancel,
  canComplete,
  isFullyCompleted,
  completionRate,
} from './rules/work-order.rules'

// lot rules
export {
  canApprove,
  canQuarantine,
  canReject,
  isUsable,
} from './rules/lot.rules'
export type { LotQualityStatus, LotContext } from './rules/lot.rules'

// box rules
export {
  canSeal,
  canAddUnits,
  remainingCapacity,
  fillRate,
} from './rules/box.rules'

// workflow rules
export {
  validateWorkflowStructure,
  canEdit,
  canTransition,
} from './rules/workflow.rules'
export type {
  ValidationError,
  ValidationResult,
  WorkflowStep,
  WorkflowGroup,
  WorkflowPhase,
  WorkflowStructure,
  AvailableRefs,
} from './rules/workflow.rules'
