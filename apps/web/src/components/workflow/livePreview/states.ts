// PROMPT_3c — Live Preview state catalogue.
//
// Per MASTER_SPECIFICATION § 14.5 the preview ships 11 states across two
// flow groups. Each state maps to an HMI-equivalent StepExecutionStatus
// (see apps/hmi/src/lib/queries.ts) so LivePreviewStepCard can mirror the
// HMI's status maps (rings/glyphs/tones) without importing them.

export type PreviewState =
  | 'idle'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'complete'
  | 'retry'
  | 'error'
  | 'failed'
  | 'warning'
  | 'timeout'
  | 'offline'

export type PreviewFlowGroup = 'ok' | 'ko'

export interface PreviewStateMeta {
  id: PreviewState
  label: string
  group: PreviewFlowGroup
}

export const PREVIEW_STATES_OK: PreviewStateMeta[] = [
  { id: 'idle', label: 'Idle', group: 'ok' },
  { id: 'ready', label: 'Pronto', group: 'ok' },
  { id: 'in_progress', label: 'In corso', group: 'ok' },
  { id: 'paused', label: 'In pausa', group: 'ok' },
  { id: 'complete', label: 'Completato', group: 'ok' },
  { id: 'retry', label: 'Retry', group: 'ok' },
]

export const PREVIEW_STATES_KO: PreviewStateMeta[] = [
  { id: 'error', label: 'Errore', group: 'ko' },
  { id: 'failed', label: 'Fallito', group: 'ko' },
  { id: 'warning', label: 'Avviso', group: 'ko' },
  { id: 'timeout', label: 'Timeout', group: 'ko' },
  { id: 'offline', label: 'Offline', group: 'ko' },
]

export const PREVIEW_STATES: PreviewStateMeta[] = [
  ...PREVIEW_STATES_OK,
  ...PREVIEW_STATES_KO,
]

// Mapping from preview state to the HMI StepExecutionStatus (the contract
// LivePreviewStepCard mirrors). `retry` and `warning` reuse `recovered` /
// `paused` to stay inside the 11 HMI status colours.
export type HmiStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'blocked'
  | 'qc_hold'
  | 'scrapped'
  | 'done'
  | 'skipped'
  | 'cancelled'
  | 'recovered'
  | 'error'

export const PREVIEW_TO_HMI_STATUS: Record<PreviewState, HmiStatus> = {
  idle: 'pending',
  ready: 'pending',
  in_progress: 'running',
  paused: 'paused',
  complete: 'done',
  retry: 'recovered',
  error: 'error',
  failed: 'scrapped',
  warning: 'qc_hold',
  timeout: 'blocked',
  offline: 'cancelled',
}
