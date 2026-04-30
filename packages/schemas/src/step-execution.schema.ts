import { z } from 'zod'

export const STEP_EXECUTION_STATUSES = [
  'pending',
  'running',
  'paused',
  'blocked',
  'qc_hold',
  'scrapped',
  'done',
  'skipped',
  'cancelled',
  'recovered',
  'error',
] as const

export const StepExecutionStatusSchema = z.enum(STEP_EXECUTION_STATUSES)
export type StepExecutionStatusValue = z.infer<typeof StepExecutionStatusSchema>

const byField = z.string().min(1).max(120).optional()

export const StepExecutionEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('START'), by: byField }),
  z.object({
    type: z.literal('COMPLETE_OK'),
    by: byField,
    durationSec: z.number().int().nonnegative().optional(),
  }),
  z.object({
    type: z.literal('COMPLETE_NOK'),
    by: byField,
    causeCode: z.string().min(1).max(80),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal('PAUSE'),
    by: byField,
    reason: z.string().max(500).optional(),
  }),
  z.object({ type: z.literal('RESUME'), by: byField }),
  z.object({ type: z.literal('REQUEST_QC'), by: byField }),
  z.object({
    type: z.literal('QC_APPROVE'),
    by: byField,
    approverId: z.string().min(1).max(60),
  }),
  z.object({
    type: z.literal('QC_REJECT'),
    by: byField,
    approverId: z.string().min(1).max(60),
    reason: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.literal('SKIP'),
    by: byField,
    reason: z.string().min(1).max(500),
  }),
  z.object({
    type: z.literal('CANCEL'),
    by: byField,
    reason: z.string().min(1).max(500),
  }),
  z.object({
    type: z.literal('MARK_SCRAPPED'),
    by: byField,
    reason: z.string().min(1).max(500),
  }),
  z.object({
    type: z.literal('RECOVER'),
    by: byField,
    notes: z.string().max(2000).optional(),
  }),
  z.object({ type: z.literal('RESUME_AFTER_RECOVERY'), by: byField }),
  z.object({ type: z.literal('COMPLETE_AFTER_RECOVERY'), by: byField }),
  z.object({
    type: z.literal('ERROR'),
    by: byField,
    errorCode: z.string().min(1).max(80),
    message: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.literal('RESET'),
    by: byField,
    supervisorId: z.string().min(1).max(60),
  }),
  z.object({
    type: z.literal('RECORD_NOTE'),
    by: byField,
    note: z.string().min(1).max(2000),
  }),
  z.object({
    type: z.literal('ASSIGN_OPERATOR'),
    by: byField,
    operatorId: z.string().min(1).max(60),
  }),
  z.object({
    type: z.literal('TICK'),
    secondsDelta: z.number().int().positive().optional(),
  }),
])

export type StepExecutionEventInput = z.infer<typeof StepExecutionEventSchema>
