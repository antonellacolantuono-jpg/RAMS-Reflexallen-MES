import { describe, it, expect } from 'vitest'
import { PNE_RECIPES } from '../recipes'
import { PNE_DEVICES } from '../plant-hierarchy'
import { PNE_ITEMS } from '../items'

describe('PNE recipes', () => {
  it('has 3 recipes with valid device + item refs; RCP-LEAK is at version 2', () => {
    expect(PNE_RECIPES).toHaveLength(3)

    const codes = PNE_RECIPES.map((r) => r.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.sort()).toEqual(['RCP-CAMERA-PNE-001', 'RCP-CRIMP-12-001', 'RCP-LEAK-PNE-12-001'])

    const deviceSerials = new Set(PNE_DEVICES.map((d) => d.serialNumber))
    const itemCodes = new Set(PNE_ITEMS.map((i) => i.code))
    for (const r of PNE_RECIPES) {
      expect(deviceSerials.has(r.deviceCode)).toBe(true)
      expect(itemCodes.has(r.itemCode)).toBe(true)
      expect(r.versions.length).toBeGreaterThan(0)
    }

    const leak = PNE_RECIPES.find((r) => r.code === 'RCP-LEAK-PNE-12-001')!
    expect(leak.currentVersion).toBe(2)
    expect(leak.deviceCode).toBe('DEV-LEAK-001')
    const v2 = leak.versions.find((v) => v.version === 2)!
    expect(v2.status).toBe('approved')
    expect(v2.parameters.test_pressure_bar).toBe(6.0)
    expect(v2.parameters.cycle_time_sec).toBe(45)
    expect(v2.parameters.pass_threshold_mbar_min).toBe(0.5)

    const crimp = PNE_RECIPES.find((r) => r.code === 'RCP-CRIMP-12-001')!
    expect(crimp.versions[0].parameters.crimp_force_kn).toBe(25.0)

    const cam = PNE_RECIPES.find((r) => r.code === 'RCP-CAMERA-PNE-001')!
    expect(cam.versions[0].parameters.rois).toHaveLength(4)
  })
})
