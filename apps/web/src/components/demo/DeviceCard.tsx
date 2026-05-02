// PROMPT_PNE_3 D2 — Demo Toggle Panel device card (presentational).
//
// Receives a MockDeviceStatus + override/start callbacks. D4 will wire the
// callbacks to the demo-api fetch wrappers + WebSocket-driven live status.

'use client'
import * as React from 'react'
import { Badge, Button, Card } from '@mes/ui'
import type { DeviceOutcome, MockDeviceStatus } from '../../lib/demo-api'

export interface DeviceCardProps {
  device: MockDeviceStatus
  onOverride?: (outcome: DeviceOutcome) => void
  onStart?: () => void
  disabled?: boolean
}

const STATE_TONE: Record<MockDeviceStatus['state'], 'neutral' | 'warn' | 'ok'> = {
  idle: 'neutral',
  running: 'warn',
  complete: 'ok',
}

export function DeviceCard({ device, onOverride, onStart, disabled = false }: DeviceCardProps) {
  const isRunning = device.state === 'running'
  const showMarginal = device.supportedOutcomes.includes('MARGINAL')

  return (
    <Card className="flex flex-col gap-3" data-testid={`device-card-${device.deviceSerialNumber}`}>
      <Card.Header>
        <div>
          <code className="block font-mono text-base font-semibold">
            {device.deviceSerialNumber}
          </code>
          <div className="mt-0.5 text-xs text-ink-2">
            Default: {device.defaultOutcome} · {device.expectedDurationSec}s cycle
          </div>
        </div>
        <Badge tone={STATE_TONE[device.state]}>{device.state.toUpperCase()}</Badge>
      </Card.Header>

      <Card.Body>
        <div className="mb-3 text-sm text-ink-2">
          {isRunning ? (
            <>
              In cycle: {device.elapsedSec.toFixed(1)}s / {device.expectedDurationSec}s
            </>
          ) : (
            <>Next override: {device.nextOutcome ?? 'none (default)'}</>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onOverride?.('PASS')}
            disabled={disabled || isRunning}
            className="bg-ok hover:bg-ok/90 text-white"
          >
            Force PASS
          </Button>
          {showMarginal && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOverride?.('MARGINAL')}
              disabled={disabled || isRunning}
              className="bg-warn hover:bg-warn/90 text-white"
            >
              Force MARGINAL
            </Button>
          )}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onOverride?.('FAIL')}
            disabled={disabled || isRunning}
          >
            Force FAIL
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onStart}
            disabled={disabled || isRunning}
          >
            Start cycle
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}
