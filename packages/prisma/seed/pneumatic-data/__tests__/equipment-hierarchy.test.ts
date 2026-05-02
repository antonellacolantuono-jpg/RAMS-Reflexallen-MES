import { describe, it, expect } from 'vitest'
import {
  PNE_AREA,
  PNE_WORK_CENTERS,
  PNE_WORKSTATIONS,
  PNE_DEVICES,
} from '../plant-hierarchy'

describe('PNE plant hierarchy', () => {
  it('renders 1 area + 4 work centers + 4 workstations + 3 devices, with valid parent refs', () => {
    expect(PNE_AREA.level).toBe('area')
    expect(PNE_AREA.parentCode).toBeNull()

    expect(PNE_WORK_CENTERS).toHaveLength(4)
    expect(PNE_WORKSTATIONS).toHaveLength(4)
    expect(PNE_DEVICES).toHaveLength(3)

    // All WC parents resolve to the area
    for (const wc of PNE_WORK_CENTERS) {
      expect(wc.parentCode).toBe(PNE_AREA.code)
      expect(wc.level).toBe('work_center')
    }

    // All WS parents resolve to a WC
    const wcCodes = new Set(PNE_WORK_CENTERS.map((wc) => wc.code))
    for (const ws of PNE_WORKSTATIONS) {
      expect(wcCodes.has(ws.parentCode)).toBe(true)
      expect(ws.level).toBe('work_unit')
    }

    // All devices reference a workstation
    const wsCodes = new Set(PNE_WORKSTATIONS.map((ws) => ws.code))
    for (const dev of PNE_DEVICES) {
      expect(wsCodes.has(dev.equipmentNodeCode)).toBe(true)
      expect(['press', 'leak_tester', 'measurement', 'scanner', 'printer']).toContain(dev.deviceType)
      expect(dev.isMock).toBe(true) // demo seed always mock
    }

    // PROMPT-spec serial numbers (acting as device codes)
    const serials = PNE_DEVICES.map((d) => d.serialNumber).sort()
    expect(serials).toEqual(['DEV-CAMERA-001', 'DEV-CRIMP-001', 'DEV-LEAK-001'])

    // Codes are globally unique
    const allCodes = [
      PNE_AREA.code,
      ...PNE_WORK_CENTERS.map((w) => w.code),
      ...PNE_WORKSTATIONS.map((w) => w.code),
    ]
    expect(new Set(allCodes).size).toBe(allCodes.length)
  })
})
