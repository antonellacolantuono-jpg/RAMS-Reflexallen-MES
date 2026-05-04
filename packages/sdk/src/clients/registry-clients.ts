import type { MesClient } from '../client.js'
import { BaseRegistryClient } from './base-registry.client.js'

// ---- Items ----
export interface ItemModel {
  id: string; code: string; name: string; itemType: string
  trackingMode: string; uom: string; description?: string
  imageUrl?: string | null
  plantId: string; isActive: boolean
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export interface Item360BomLine {
  id: string; componentId: string; componentCode: string; componentName: string
  qty: number; uom: string; position: number; isOptional: boolean; notes?: string | null
}
export interface Item360ToolUsed {
  id: string; code: string; name: string; wearStatus: string
  currentCyclesCount: number; maxCycles: number | null
  workflowNames: string[]
}
export interface Item360SkillRequired {
  id: string; code: string; name: string; category: string
  workflowNames: string[]
}
export interface Item360WorkflowSummary {
  id: string; code: string; name: string
  currentVersionNumber: number | null
  stepsCount: number
}
export interface Item360WorkLocation {
  workCenter: { id: string; code: string; name: string; status: string }
  workUnits: Array<{ id: string; code: string; name: string; status: string; activeDevicesCount: number }>
}
export interface Item360ProductionStats {
  woCompleted: number; scrapRate: number; avgCycleTimeSec: number
  isMock: true
}
export interface Item360Response {
  item: ItemModel
  bom: Item360BomLine[]
  toolsUsed: Item360ToolUsed[]
  skillsRequired: Item360SkillRequired[]
  workflows: Item360WorkflowSummary[]
  workCenters: Item360WorkLocation[]
  productionStats: Item360ProductionStats
}
export class ItemsClient extends BaseRegistryClient<ItemModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/items') }
  whereUsed(id: string) { return this.client.get<ItemModel[]>(`/api/items/${id}/where-used`) }
  get360(id: string) { return this.client.get<Item360Response>(`/api/items/${id}/360`) }
}

// ---- BOM ----
export interface BomModel {
  id: string; itemId: string; version: number; status: string
  effectiveFrom?: string; effectiveTo?: string; notes?: string
  lines: BomLineModel[]
  createdAt: string; updatedAt: string; deletedAt?: string
  createdBy: string; updatedBy: string
}
export interface BomLineModel {
  id: string; bomId: string; componentId: string
  qty: number; uom: string; position: number; isOptional: boolean; notes?: string
}
export class BomClient extends BaseRegistryClient<BomModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/bom') }
  tree(id: string) { return this.client.get<BomModel>(`/api/bom/${id}/tree`) }
}

// ---- Equipment ----
export interface EquipmentNodeModel {
  id: string; code: string; name: string; level: string; class: string
  status: string; parentId?: string; plantId: string; description?: string
  imageUrl?: string | null
  children?: EquipmentNodeModel[]
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export class EquipmentClient extends BaseRegistryClient<EquipmentNodeModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/equipment') }
  tree() { return this.client.get<EquipmentNodeModel[]>('/api/equipment/tree') }
}

// ---- Recipes ----
export interface RecipeModel {
  id: string; code: string; name: string; status: string
  deviceId?: string; itemId?: string; plantId: string
  versions?: RecipeVersionModel[]
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export interface RecipeVersionModel {
  id: string; recipeId: string; version: number; status: string
  parameters: string; approvedBy?: string; approvedAt?: string; notes?: string
  createdAt: string; createdBy: string
}
export class RecipesClient extends BaseRegistryClient<RecipeModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/recipes') }
  approve(id: string, data: Record<string, unknown>) { return this.client.post<RecipeModel>(`/api/recipes/${id}/approve`, data) }
}

// ---- Skills ----
export interface SkillModel {
  id: string; code: string; name: string; category: string; description?: string
  plantId: string
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export class SkillsClient extends BaseRegistryClient<SkillModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/skills') }
  matrix() { return this.client.get<unknown>('/api/skills/matrix') }
}

// ---- Operators ----
export interface OperatorModel {
  id: string; badge: string; firstName: string; lastName: string
  status: string; photoUrl?: string; plantId: string
  operatorSkills?: OperatorSkillModel[]
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export interface OperatorSkillModel {
  id: string; operatorId: string; skillId: string
  certifiedAt: string; expiresAt?: string; level: string; certifiedBy: string
}
export class OperatorsClient extends BaseRegistryClient<OperatorModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/operators') }
  assignSkill(id: string, data: Record<string, unknown>) { return this.client.post<OperatorSkillModel>(`/api/operators/${id}/skills`, data) }
  removeSkill(id: string, skillId: string) { return this.client.delete<void>(`/api/operators/${id}/skills/${skillId}`) }
}

// ---- Cause Codes ----
export interface CauseCodeModel {
  id: string; code: string; name: string; category: string
  phase?: string; description?: string; plantId: string
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export class CauseCodesClient extends BaseRegistryClient<CauseCodeModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/cause-codes') }
}

// ---- Attention Points ----
export interface AttentionPointModel {
  id: string; entityType: string; entityId: string
  severity: string; message: string
  resolvedAt?: string; resolvedBy?: string; resolveNote?: string
  plantId: string; createdAt: string; createdBy: string
}
export class AttentionPointsClient extends BaseRegistryClient<AttentionPointModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/attention-points') }
  resolve(id: string, data: Record<string, unknown>) { return this.client.post<AttentionPointModel>(`/api/attention-points/${id}/resolve`, data) }
}

// ---- Tools ----
export interface ToolModel {
  id: string; code: string; name: string; equipmentNodeId?: string
  currentCyclesCount: number; maxCycles?: number; wearStatus: string
  lastUsedAt?: string; replacedAt?: string; replacementCount: number
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export interface ReplaceToolPayload {
  reason: string
  photoBase64?: string
  replacementToolId?: string
}
export class ToolsClient extends BaseRegistryClient<ToolModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/tools') }
  replace(id: string, data: ReplaceToolPayload) {
    return this.client.post<ToolModel>(`/api/tools/${id}/replace`, data)
  }
}

// ---- Maintenance Orders ----
export interface MaintenanceOrderModel {
  id: string
  code: string
  equipmentNodeId: string
  type: string
  status: string
  priority: string
  description: string
  plannedStart: string
  plannedEnd: string
  actualStart?: string | null
  actualEnd?: string | null
  assignedToId?: string | null
  startedBy?: string | null
  completedBy?: string | null
  cancelledBy?: string | null
  cancelReason?: string | null
  plantId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  version: number
  createdBy: string
  updatedBy: string
  equipmentNode?: { id: string; code: string; name: string } | null
}
export class MaintenanceOrdersClient extends BaseRegistryClient<MaintenanceOrderModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/maintenance-orders') }
}

// ---- Box Types ----
export interface BoxTypeModel {
  id: string; code: string; name: string; category: string
  maxWeightG?: number; maxVolumeL?: number; maxUnitsCount?: number
  isReturnable: boolean; description?: string; plantId: string
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export class BoxTypesClient extends BaseRegistryClient<BoxTypeModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/box-types') }
}

// ---- Boxes ----
export interface BoxModel {
  id: string; code: string; boxTypeId: string; status: string
  currentWeightG: number; currentVolumeL: number; currentUnitsCount: number
  lotId?: string; sealedAt?: string; sealedBy?: string; cyclesCount: number
  plantId: string
  createdAt: string; updatedAt: string; deletedAt?: string; version: number
  createdBy: string; updatedBy: string
}
export class BoxesClient extends BaseRegistryClient<BoxModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/boxes') }
  movements(id: string) { return this.client.get<unknown[]>(`/api/boxes/${id}/movements`) }
}

// ---- Auto-Gen Rules ----
export interface AutoGenRuleModel {
  id: string; name: string; description: string
  trigger: string; scope: string
}
export interface AutoGenDryRunResponse {
  ruleId: string
  code: string
  contextEcho: Record<string, unknown>
}
export class AutoGenRulesClient {
  constructor(private readonly client: MesClient) {}
  list() { return this.client.get<AutoGenRuleModel[]>('/api/auto-gen-rules') }
  dryRun(ruleId: string, context: Record<string, unknown>) {
    return this.client.post<AutoGenDryRunResponse>(
      `/api/auto-gen-rules/${ruleId}/dry-run`,
      context,
    )
  }
}

// ---- Workflows ----
export interface WorkflowStepModel {
  id: string; groupId: string; order: number; category: string
  actionType: string; type: string; source: string; name: string
  instructions?: string | null; skillId?: string | null; deviceId?: string | null
  recipeId?: string | null; toolId?: string | null; workUnitId?: string | null
  standardTimeSec?: number | null
  isRequired: boolean; partReference?: string | null; noTargetPolicy?: string | null
  /** PROMPT_7 D1 — JSON-serialized polymorphic step data ({ recoveryConfig?, photoUrl?, actionType? }). Parse on demand. */
  data?: string | null
  createdAt: string; updatedAt: string; createdBy: string; updatedBy: string
}
export interface WorkflowGroupModel {
  id: string; phaseId: string; order: number; category: string; name: string
  description?: string | null; supportsParallel: boolean; supportsRecovery: boolean
  isAutoGenerated: boolean; steps: WorkflowStepModel[]
  createdAt: string; updatedAt: string; createdBy: string; updatedBy: string
}
export interface WorkflowPhaseModel {
  id: string; workflowVersionId: string; order: number; category: string; name: string
  description?: string | null; isCycleBased: boolean; isAutoGenerated: boolean
  imageUrl?: string | null
  groups: WorkflowGroupModel[]
  createdAt: string; updatedAt: string; createdBy: string; updatedBy: string
}
export interface WorkflowVersionModel {
  id: string; workflowId: string; version: number; status: string
  approvedBy?: string | null; approvedAt?: string | null; notes?: string | null
  createdAt: string; createdBy: string; updatedAt: string; updatedBy: string
  phases?: WorkflowPhaseModel[]
}
export interface WorkflowModel {
  id: string; code: string; name: string; description?: string | null
  itemId?: string | null; currentVersionId?: string | null; plantId: string
  createdAt: string; updatedAt: string; deletedAt?: string | null
  version: number; createdBy: string; updatedBy: string
  currentVersion?: WorkflowVersionModel | null
}
export class WorkflowsClient extends BaseRegistryClient<WorkflowModel, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {
  constructor(client: MesClient) { super(client, '/api/workflows') }
  versions(id: string) { return this.client.get<WorkflowVersionModel[]>(`/api/workflows/${id}/versions`) }
  createVersion(id: string) { return this.client.post<WorkflowVersionModel>(`/api/workflows/${id}/versions`, {}) }
  getVersion(id: string, vid: string) { return this.client.get<WorkflowVersionModel>(`/api/workflows/${id}/versions/${vid}`) }
  updateVersion(id: string, vid: string, data: Record<string, unknown>) { return this.client.patch<WorkflowVersionModel>(`/api/workflows/${id}/versions/${vid}`, data) }
  approveVersion(id: string, vid: string) { return this.client.post<WorkflowVersionModel>(`/api/workflows/${id}/versions/${vid}/approve`, {}) }
  deprecateVersion(id: string, vid: string, reason: string) { return this.client.post<WorkflowVersionModel>(`/api/workflows/${id}/versions/${vid}/deprecate`, { reason }) }
  clone(id: string, data: { code: string; name: string; description?: string; plantId?: string }) { return this.client.post<WorkflowModel>(`/api/workflows/${id}/clone`, data) }
}

// ---- Work Orders (back-office detail; PROMPT_DESIGN_ALIGNMENT D3 batch 9) ----
export interface WorkOrderSnapshotStepModel {
  id: string; order: number; category: string; actionType: string; name: string
  deviceCategory: string | null; partReference: string | null; standardTimeSec: number | null
  workUnitId: string | null
  workUnit: { id: string; code: string; name: string } | null
}
export interface WorkOrderSnapshotGroupModel {
  id: string; order: number; category: string; name: string; isAutoGenerated: boolean
  steps: WorkOrderSnapshotStepModel[]
}
export interface WorkOrderSnapshotPhaseModel {
  id: string; order: number; category: string; name: string; isAutoGenerated: boolean
  imageUrl?: string | null
  groups: WorkOrderSnapshotGroupModel[]
}
export interface WorkOrderSnapshotProjection {
  workflowVersionNumber: number
  phases: WorkOrderSnapshotPhaseModel[]
}
export interface WorkOrderBomLineModel {
  id: string; componentCode: string; componentName: string; qty: number; uom: string
}
export interface WorkOrderAssignmentModel {
  operatorId: string; operatorBadge: string; operatorName: string
  status: string; assignedAt: string; acceptedAt: string | null
}
export interface WorkOrderDetailModel {
  id: string; code: string; status: string; priority: string; type: string
  qtyTarget: number; qtyProduced: number; qtyScrap: number; qtyRework: number
  scheduledStart: string | null; scheduledEnd: string | null
  actualStart: string | null; actualEnd: string | null
  releasedAt: string | null; releasedBy: string | null
  notes: string | null; plantId: string
  createdAt: string; updatedAt: string
  item: { id: string; code: string; name: string; uom: string }
  bom: { id: string; version: number; lines: WorkOrderBomLineModel[] } | null
  workflowSnapshot: {
    id: string; workflowVersionId: string
    snapshotData: WorkOrderSnapshotProjection | null; createdAt: string
  } | null
  assignments: WorkOrderAssignmentModel[]
  stepExecutionStats: {
    total: number; pending: number; running: number; done: number; nok: number
  }
}
export interface WorkOrderAuditEntry {
  id: string; entityType: string; entityId: string; action: string
  changedBy: string; changedAt: string
  before: unknown; after: unknown
}
export class WorkOrdersClient {
  constructor(private readonly client: MesClient) {}
  get(id: string) { return this.client.get<WorkOrderDetailModel>(`/api/work-orders/${id}`) }
  audit(id: string) {
    return this.client.get<{ data: WorkOrderAuditEntry[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/work-orders/${id}/audit`,
    )
  }
}
