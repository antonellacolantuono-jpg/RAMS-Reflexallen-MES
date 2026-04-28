export * from './machines/index.js'

// RuleResult is identical across all rules files — export once
export type { RuleResult } from './rules/work-order.rules.js'

// work-order rules
export {
  canRelease,
  canCancel,
  canComplete,
  isFullyCompleted,
  completionRate,
} from './rules/work-order.rules.js'

// lot rules
export {
  canApprove,
  canQuarantine,
  canReject,
  isUsable,
} from './rules/lot.rules.js'
export type { LotQualityStatus, LotContext } from './rules/lot.rules.js'

// box rules
export {
  canSeal,
  canAddUnits,
  remainingCapacity,
  fillRate,
} from './rules/box.rules.js'

// workflow rules
export {
  validateWorkflowStructure,
  canEdit,
  canTransition,
} from './rules/workflow.rules.js'
export type {
  ValidationError,
  ValidationResult,
  WorkflowStep,
  WorkflowGroup,
  WorkflowPhase,
  WorkflowStructure,
  AvailableRefs,
} from './rules/workflow.rules.js'
