export const RULE_IDS = {
  LOT_NUMBER: '1',
  WORK_ORDER_NUMBER: '2',
  BOX_CODE: '3',
  MAINTENANCE_ORDER: '4',
  RECIPE_VERSION: '5',
  SAMPLE_ID: '6',
  DOWNTIME_EVENT: '7',
} as const

export type RuleId = (typeof RULE_IDS)[keyof typeof RULE_IDS]

export const ALL_RULE_IDS: readonly RuleId[] = Object.values(RULE_IDS)
