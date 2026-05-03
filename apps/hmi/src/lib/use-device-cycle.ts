'use client'
import * as React from 'react'
import { getSocket } from './socket'

export type DeviceCycleStatus = 'idle' | 'running' | 'complete'
export type DeviceOutcome = 'PASS' | 'MARGINAL' | 'FAIL'

export interface PressureSample {
  t: number
  bar: number
}

export interface DeviceCycleState {
  status: DeviceCycleStatus
  stepExecutionId: string | null
  startedAt: string | null
  elapsedSec: number
  expectedDurationSec: number
  phase: string | null
  pressureBar: number
  leakRateMbarMin: number
  pressureHistory: PressureSample[]
  outcome: DeviceOutcome | null
  resultDurationSec: number | null
  result: Record<string, unknown> | null
  rois: RoiSample[]
}

export interface RoiSample {
  name: string
  similarity: number
  threshold: number
}

export interface CycleStartedEvent {
  deviceSerialNumber: string
  stepExecutionId: string
  expectedDurationSec: number
  startedAt: string
  recipe?: Record<string, unknown>
}

export interface CycleProgressEvent {
  deviceSerialNumber: string
  stepExecutionId: string
  elapsedSec: number
  telemetry: Record<string, unknown>
}

export interface CycleCompleteEvent {
  deviceSerialNumber: string
  stepExecutionId: string
  outcome: DeviceOutcome
  durationSec: number
  result: Record<string, unknown>
}

const PRESSURE_HISTORY_MAX = 60

const INITIAL: DeviceCycleState = {
  status: 'idle',
  stepExecutionId: null,
  startedAt: null,
  elapsedSec: 0,
  expectedDurationSec: 0,
  phase: null,
  pressureBar: 0,
  leakRateMbarMin: 0,
  pressureHistory: [],
  outcome: null,
  resultDurationSec: null,
  result: null,
  rois: [],
}

/**
 * Subscribes to `device:cycle:*` WS events for the given device serial number
 * and returns the most recent cycle state. Idempotent: re-subscribing for the
 * same device replaces the handler instead of stacking.
 *
 * Pure browser hook — getSocket() is not invoked during SSR.
 */
export function useDeviceCycle(deviceSerialNumber: string): DeviceCycleState {
  const [state, setState] = React.useState<DeviceCycleState>(INITIAL)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const socket = getSocket()

    const handleStarted = (payload: CycleStartedEvent) => {
      if (payload.deviceSerialNumber !== deviceSerialNumber) return
      setState((prev) => ({
        ...prev,
        status: 'running',
        stepExecutionId: payload.stepExecutionId,
        startedAt: payload.startedAt,
        expectedDurationSec: payload.expectedDurationSec,
        elapsedSec: 0,
        phase: null,
        pressureBar: 0,
        leakRateMbarMin: 0,
        pressureHistory: [],
        outcome: null,
        resultDurationSec: null,
        result: null,
        rois: [],
      }))
    }

    const handleProgress = (payload: CycleProgressEvent) => {
      if (payload.deviceSerialNumber !== deviceSerialNumber) return
      setState((prev) => {
        const telemetry = payload.telemetry ?? {}
        const pressureBar =
          typeof telemetry['pressureBar'] === 'number'
            ? (telemetry['pressureBar'] as number)
            : prev.pressureBar
        const phase =
          typeof telemetry['phase'] === 'string'
            ? (telemetry['phase'] as string)
            : prev.phase
        const leakRateMbarMin =
          typeof telemetry['leakRateMbarMin'] === 'number'
            ? (telemetry['leakRateMbarMin'] as number)
            : prev.leakRateMbarMin
        const rois = Array.isArray(telemetry['rois'])
          ? (telemetry['rois'] as RoiSample[])
          : prev.rois
        const nextHistory = [
          ...prev.pressureHistory,
          { t: payload.elapsedSec, bar: pressureBar },
        ].slice(-PRESSURE_HISTORY_MAX)
        return {
          ...prev,
          status: 'running',
          elapsedSec: payload.elapsedSec,
          phase,
          pressureBar,
          leakRateMbarMin,
          pressureHistory: nextHistory,
          rois,
        }
      })
    }

    const handleComplete = (payload: CycleCompleteEvent) => {
      if (payload.deviceSerialNumber !== deviceSerialNumber) return
      setState((prev) => ({
        ...prev,
        status: 'complete',
        elapsedSec: payload.durationSec,
        outcome: payload.outcome,
        resultDurationSec: payload.durationSec,
        result: payload.result,
      }))
    }

    socket.on('device:cycle:started', handleStarted)
    socket.on('device:cycle:progress', handleProgress)
    socket.on('device:cycle:complete', handleComplete)

    return () => {
      socket.off('device:cycle:started', handleStarted)
      socket.off('device:cycle:progress', handleProgress)
      socket.off('device:cycle:complete', handleComplete)
    }
  }, [deviceSerialNumber])

  return state
}

export const __INITIAL_DEVICE_CYCLE_STATE__ = INITIAL
