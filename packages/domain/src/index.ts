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
  extractErrorNodeIds,
  groupErrorsByNodeId,
} from './rules/workflow.rules'
export type {
  ValidationError,
  ValidationResult,
  WorkflowStep,
  WorkflowGroup,
  WorkflowPhase,
  WorkflowStructure,
  AvailableRefs,
  ErrorNodeIds,
} from './rules/workflow.rules'

// parallel-ops rules
export {
  splitGroupIntoLanes,
  areAllParallelLanesTerminal,
  isParallelSyncTrigger,
} from './rules/parallel-ops.rules'
export type {
  Lane,
  LaneKind,
  DeviceCategory,
  ParallelStep,
  ParallelGroup,
  ParallelStepWithStatus,
  ParallelLayout,
  SyncPoint,
} from './rules/parallel-ops.rules'

// quality-hold rules (D5 of PROMPT_5_FULL)
export {
  requiresQcApproval,
  canApproveQcHold,
  triggersQualityHold,
  pickNokEvent,
  QC_CATEGORY,
  QC_SKILL_CODE,
} from './rules/quality-hold.rules'

// manager rules (D6 of PROMPT_5_FULL)
export {
  canReleaseWorkOrder,
  MANAGER_SKILL_CODE,
} from './rules/manager.rules'

// workflow-snapshot rules (D6 of PROMPT_5_FULL)
export {
  cloneWorkflowTree,
  listClonedStepIds,
} from './rules/workflow-snapshot.rules'
export type {
  SourceStep,
  SourceGroup,
  SourcePhase,
  SourceWorkflowVersion,
  ClonedStep,
  ClonedGroup,
  ClonedPhase,
  WorkflowSnapshotPayload,
} from './rules/workflow-snapshot.rules'

// workflow-palette rules (D1 of PROMPT_3d)
export {
  STEP_CATEGORIES,
  STEP_KINDS,
  getStepCategoryDescriptor,
  getStepKindDescriptor,
} from './rules/workflow-palette.rules'
export type {
  StepCategoryId,
  StepKindId,
  StepCategoryDescriptor,
  StepKindDescriptor,
} from './rules/workflow-palette.rules'

// workflow-compatibility rules (D2 of PROMPT_3d)
export {
  isStepCategoryAllowedInGroup,
  listAllowedStepCategories,
  mapPaletteCategoryToStepCategory,
} from './rules/workflow-compatibility.rules'
export type {
  GroupCategory,
  SchemaStepCategory,
} from './rules/workflow-compatibility.rules'
