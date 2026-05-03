'use client'

import {
  MesClient,
  ItemsClient,
  BomClient,
  EquipmentClient,
  RecipesClient,
  SkillsClient,
  OperatorsClient,
  CauseCodesClient,
  AttentionPointsClient,
  ToolsClient,
  BoxTypesClient,
  BoxesClient,
  AutoGenRulesClient,
  WorkflowsClient,
  WorkOrdersClient,
  MaintenanceOrdersClient,
} from '@mes/sdk'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'

export const mesClient = new MesClient({ baseUrl: API_BASE })

export const itemsClient = new ItemsClient(mesClient)
export const bomClient = new BomClient(mesClient)
export const equipmentClient = new EquipmentClient(mesClient)
export const recipesClient = new RecipesClient(mesClient)
export const skillsClient = new SkillsClient(mesClient)
export const operatorsClient = new OperatorsClient(mesClient)
export const causeCodesClient = new CauseCodesClient(mesClient)
export const attentionPointsClient = new AttentionPointsClient(mesClient)
export const toolsClient = new ToolsClient(mesClient)
export const boxTypesClient = new BoxTypesClient(mesClient)
export const boxesClient = new BoxesClient(mesClient)
export const autoGenRulesClient = new AutoGenRulesClient(mesClient)
export const workflowsClient = new WorkflowsClient(mesClient)
export const workOrdersClient = new WorkOrdersClient(mesClient)
export const maintenanceOrdersClient = new MaintenanceOrdersClient(mesClient)

export const sdk = {
  items: itemsClient,
  bom: bomClient,
  equipment: equipmentClient,
  recipes: recipesClient,
  skills: skillsClient,
  operators: operatorsClient,
  causeCodes: causeCodesClient,
  attentionPoints: attentionPointsClient,
  tools: toolsClient,
  boxTypes: boxTypesClient,
  boxes: boxesClient,
  autoGenRules: autoGenRulesClient,
  workflows: workflowsClient,
  workOrders: workOrdersClient,
  maintenanceOrders: maintenanceOrdersClient,
}
