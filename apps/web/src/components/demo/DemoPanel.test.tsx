import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DemoPanel } from './DemoPanel'
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
  lastOutcome: null,
  telemetry: {},
}

const idleCamera: MockDeviceStatus = {
  ...idleLeak,
  deviceSerialNumber: 'DEV-CAMERA-001',
  expectedDurationSec: 8,
  supportedOutcomes: ['PASS', 'FAIL'],
}

const idleCrimp: MockDeviceStatus = {
  ...idleLeak,
  deviceSerialNumber: 'DEV-CRIMP-001',
  expectedDurationSec: 8,
  supportedOutcomes: ['PASS', 'FAIL'],
}

describe('DemoPanel', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/internal/mock-devices')) {
        return new Response(
          JSON.stringify({ devices: [idleLeak, idleCamera, idleCrimp] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.includes('/override-next')) {
        return new Response(
          JSON.stringify({ deviceSerialNumber: 'DEV-LEAK-001', nextOutcome: 'FAIL' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.endsWith('/api/internal/mock-devices/DEV-LEAK-001')) {
        return new Response(
          JSON.stringify({ device: { ...idleLeak, nextOutcome: 'FAIL' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('not found', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches devices on mount and posts to override-next when Force FAIL is clicked', async () => {
    render(<DemoPanel />)

    // 1. Initial list call lands and the 3 device cards render.
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/internal/mock-devices'),
        expect.objectContaining({ credentials: 'include' }),
      )
    })
    expect(screen.getByText('DEV-LEAK-001')).toBeInTheDocument()
    expect(screen.getByText('DEV-CAMERA-001')).toBeInTheDocument()
    expect(screen.getByText('DEV-CRIMP-001')).toBeInTheDocument()

    // 2. Click Force FAIL on the first card (leak) and verify the POST hits
    //    /override-next with the right payload.
    const failButtons = screen.getAllByRole('button', { name: 'Force FAIL' })
    fireEvent.click(failButtons[0]!)

    await waitFor(() => {
      const overrideCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).includes('/DEV-LEAK-001/override-next'),
      )
      expect(overrideCall).toBeDefined()
      const init = overrideCall![1] as RequestInit
      expect(init.method).toBe('POST')
      expect(init.body).toBe(JSON.stringify({ outcome: 'FAIL' }))
    })
  })
})
