import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeviceCard } from './DeviceCard'
import type { MockDeviceStatus } from '../../lib/demo-api'

const idleLeak: MockDeviceStatus = {
  deviceSerialNumber: 'DEV-LEAK-001',
  state: 'idle',
  stepExecutionId: null,
  startedAt: null,
  elapsedSec: 0,
  expectedDurationSec: 45,
  defaultOutcome: 'PASS',
  supportedOutcomes: ['PASS', 'MARGINAL', 'FAIL'],
  nextOutcome: null,
  telemetry: {},
}

const runningCamera: MockDeviceStatus = {
  deviceSerialNumber: 'DEV-CAMERA-001',
  state: 'running',
  stepExecutionId: 'se-1',
  startedAt: '2026-05-02T10:00:00.000Z',
  elapsedSec: 3.5,
  expectedDurationSec: 8,
  defaultOutcome: 'PASS',
  supportedOutcomes: ['PASS', 'FAIL'],
  nextOutcome: null,
  telemetry: { phase: 'analyze' },
}

describe('DeviceCard', () => {
  it('renders device code, idle badge, and PASS/MARGINAL/FAIL/Start buttons (leak supports all 3 outcomes)', () => {
    const onOverride = vi.fn()
    const onStart = vi.fn()
    render(<DeviceCard device={idleLeak} onOverride={onOverride} onStart={onStart} />)

    expect(screen.getByText('DEV-LEAK-001')).toBeInTheDocument()
    expect(screen.getByText('IDLE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Force PASS' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Force MARGINAL' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Force FAIL' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Start cycle' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Force FAIL' }))
    expect(onOverride).toHaveBeenCalledWith('FAIL')
  })

  it('hides MARGINAL button when device only supports PASS/FAIL (camera/crimp)', () => {
    render(<DeviceCard device={runningCamera} />)

    expect(screen.queryByRole('button', { name: 'Force MARGINAL' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Force PASS' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Force FAIL' })).toBeInTheDocument()
  })

  it('disables all action buttons while a cycle is running, shows elapsed/expected time', () => {
    render(<DeviceCard device={runningCamera} />)

    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(screen.getByText(/3\.5s \/ 8s/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Force PASS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Force FAIL' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Start cycle' })).toBeDisabled()
  })
})
