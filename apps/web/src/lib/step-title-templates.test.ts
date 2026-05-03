import { describe, it, expect } from 'vitest'
import {
  buildAutofilledTitle,
  buildAutofilledDescription,
  getTemplate,
} from './step-title-templates'

describe('step-title-templates', () => {
  it('autofills the title prefix from the action type alone (no resource)', () => {
    expect(buildAutofilledTitle('apply_label', null)).toBe('Applica etichetta')
    expect(buildAutofilledTitle('scan_qr', null)).toBe('Scansiona QR')
    expect(buildAutofilledTitle('device_run', undefined)).toBe(
      'Avvia ciclo dispositivo',
    )
  })

  it('appends the resource code to the title prefix when provided', () => {
    expect(buildAutofilledTitle('apply_label', 'LBL-PNE-001')).toBe(
      'Applica etichetta LBL-PNE-001',
    )
    expect(buildAutofilledTitle('device_run', 'DEV-LEAK-001')).toBe(
      'Avvia ciclo dispositivo DEV-LEAK-001',
    )
    // Whitespace-only resource code is treated as absent.
    expect(buildAutofilledTitle('apply_label', '   ')).toBe('Applica etichetta')
  })

  it('returns the description template per action type and falls back empty', () => {
    expect(buildAutofilledDescription('apply_label')).toBe(
      'Applicare l’etichetta sul pezzo.',
    )
    expect(buildAutofilledDescription('scan_qr')).toBe(
      'Scansionare il codice QR con il lettore.',
    )
    expect(buildAutofilledDescription('not_a_real_action')).toBe('')
    expect(getTemplate('apply_label')?.title).toBe('Applica etichetta')
  })
})
