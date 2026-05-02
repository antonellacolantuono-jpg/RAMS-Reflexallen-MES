// PROMPT_PNE_3 D2 — Client-side bindings for the /api/internal/mock-devices/*
// endpoints. Pure fetch wrappers (no TanStack Query yet — D4 will add live
// status polling + WebSocket subscription).

export type DeviceOutcome = 'PASS' | 'MARGINAL' | 'FAIL'
export type MockDeviceLifecycleState = 'idle' | 'running' | 'complete'

export interface MockDeviceStatus {
  deviceSerialNumber: string
  state: MockDeviceLifecycleState
  stepExecutionId: string | null
  startedAt: string | null
  elapsedSec: number
  expectedDurationSec: number
  defaultOutcome: DeviceOutcome
  supportedOutcomes: readonly DeviceOutcome[]
  nextOutcome: DeviceOutcome | null
  telemetry: Record<string, unknown>
}

export const DEVICE_CODES = {
  LEAK: 'DEV-LEAK-001',
  CAMERA: 'DEV-CAMERA-001',
  CRIMP: 'DEV-CRIMP-001',
} as const

const API_BASE =
  typeof process !== 'undefined' ? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000' : 'http://localhost:3000'

export async function listMockDevices(): Promise<MockDeviceStatus[]> {
  const res = await fetch(`${API_BASE}/api/internal/mock-devices`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`listMockDevices failed: ${res.status}`)
  const json = (await res.json()) as { devices: MockDeviceStatus[] }
  return json.devices
}

export async function getMockDeviceStatus(deviceCode: string): Promise<MockDeviceStatus> {
  const res = await fetch(`${API_BASE}/api/internal/mock-devices/${deviceCode}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`getMockDeviceStatus failed: ${res.status}`)
  const json = (await res.json()) as { device: MockDeviceStatus }
  return json.device
}

export async function overrideNextOutcome(
  deviceCode: string,
  outcome: DeviceOutcome,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/internal/mock-devices/${deviceCode}/override-next`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome }),
  })
  if (!res.ok) throw new Error(`overrideNextOutcome failed: ${res.status}`)
}

export async function startMockCycle(
  deviceCode: string,
  stepExecutionId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/internal/mock-devices/${deviceCode}/start-cycle`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stepExecutionId }),
  })
  if (!res.ok) throw new Error(`startMockCycle failed: ${res.status}`)
}
