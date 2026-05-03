// PROMPT_3c — Live Preview deterministic mock data engine.
//
// The Live Preview sidebar renders a workflow editor's selected step node as
// the operator will see it on the HMI. Two pieces of data are needed:
//
//   1. The step config the engineer just typed (name, category, actionType,
//      instructions, deviceCategory, photoUrl) — pulled from `node.data`.
//   2. Runtime fields the operator's HMI shows but the AST doesn't have
//      (durationSec, attemptCount, recoveryStage, blockedNote) — synthesized
//      deterministically from `(stepId, state)` so the preview is reproducible
//      across re-renders without random flicker.

import type { Node } from '@xyflow/react'
import type { PreviewState } from './states'

export interface PreviewStepData {
  id: string
  name: string
  category: string
  actionType: string
  instructions: string | null
  deviceCategory: string | null
  deviceSerialNumber: string | null
  photoUrl: string | null
}

export interface PreviewRuntimeFields {
  durationSec: number | null
  attemptCount: number
  blockedNote: string | null
}

const FALLBACK_INSTRUCTIONS =
  'Esegui la verifica visiva del componente secondo SOP.'

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function nodeToPreviewData(
  node: Node | undefined,
): PreviewStepData | null {
  if (!node || node.type !== 'stepNode') return null
  const d = node.data ?? {}
  return {
    id: node.id,
    name: asString(d['label']) ?? 'Step senza nome',
    category: asString(d['category']) ?? 'production',
    actionType: asString(d['actionType']) ?? 'manual_op',
    instructions: asString(d['instructions']) ?? FALLBACK_INSTRUCTIONS,
    deviceCategory: asString(d['deviceCategory']),
    deviceSerialNumber: asString(d['deviceSerialNumber']),
    photoUrl: asString(d['photoUrl']),
  }
}

// Tiny FNV-1a 32-bit hash. Keeps mock fields stable per stepId without the
// runtime cost (or non-determinism) of crypto.subtle.
function hashStepId(stepId: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < stepId.length; i++) {
    h ^= stepId.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

const BLOCKED_NOTES = [
  'Pezzo fuori tolleranza, segnalato al supervisore.',
  'Materiale non conforme — lotto da quarantenare.',
  'Strumento non disponibile, attendere sostituzione.',
  'Ricetta scaduta — caricare versione approvata.',
]

export function mockStateFields(
  state: PreviewState,
  stepId: string,
): PreviewRuntimeFields {
  const h = hashStepId(stepId)

  switch (state) {
    case 'idle':
    case 'ready':
      return { durationSec: null, attemptCount: 0, blockedNote: null }
    case 'in_progress': {
      // Deterministic 30-179s window so the timer always shows something
      // believable for a manual op.
      const durationSec = 30 + (h % 150)
      return { durationSec, attemptCount: 1, blockedNote: null }
    }
    case 'paused': {
      const durationSec = 15 + (h % 60)
      return { durationSec, attemptCount: 1, blockedNote: null }
    }
    case 'complete': {
      const durationSec = 60 + (h % 240)
      return { durationSec, attemptCount: 1, blockedNote: null }
    }
    case 'retry': {
      const durationSec = 20 + (h % 100)
      return { durationSec, attemptCount: 2, blockedNote: null }
    }
    case 'error':
      return {
        durationSec: 5 + (h % 30),
        attemptCount: 1,
        blockedNote: 'Errore di esecuzione — reset richiesto.',
      }
    case 'failed': {
      const noteIndex = h % BLOCKED_NOTES.length
      return {
        durationSec: 10 + (h % 60),
        attemptCount: 2,
        blockedNote: BLOCKED_NOTES[noteIndex] ?? null,
      }
    }
    case 'warning':
      return {
        durationSec: 25 + (h % 60),
        attemptCount: 1,
        blockedNote: 'Soglia di attenzione superata — verificare.',
      }
    case 'timeout':
      return {
        durationSec: 300 + (h % 120),
        attemptCount: 1,
        blockedNote: 'Tempo massimo superato.',
      }
    case 'offline':
      return {
        durationSec: null,
        attemptCount: 0,
        blockedNote: 'Dispositivo non raggiungibile.',
      }
  }
}
