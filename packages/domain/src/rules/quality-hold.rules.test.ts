import { describe, it, expect } from 'vitest'
import {
  requiresQcApproval,
  canApproveQcHold,
  triggersQualityHold,
  pickNokEvent,
  QC_CATEGORY,
  QC_SKILL_CODE,
} from './quality-hold.rules'

describe('requiresQcApproval', () => {
  it('returns true for quality_control category', () => {
    expect(requiresQcApproval(QC_CATEGORY)).toBe(true)
    expect(requiresQcApproval('quality_control')).toBe(true)
  })

  it('returns false for non-QC categories', () => {
    expect(requiresQcApproval('production')).toBe(false)
    expect(requiresQcApproval('logistics')).toBe(false)
    expect(requiresQcApproval('identification')).toBe(false)
    expect(requiresQcApproval('setup')).toBe(false)
    expect(requiresQcApproval('teardown')).toBe(false)
    expect(requiresQcApproval('recovery')).toBe(false)
  })
})

describe('canApproveQcHold', () => {
  it('returns true when QC skill code is present', () => {
    expect(canApproveQcHold(['QC'])).toBe(true)
    expect(canApproveQcHold(['EXT', 'QC', 'TEST'])).toBe(true)
    expect(canApproveQcHold([QC_SKILL_CODE])).toBe(true)
  })

  it('returns false when QC skill code is absent', () => {
    expect(canApproveQcHold([])).toBe(false)
    expect(canApproveQcHold(['EXT'])).toBe(false)
    expect(canApproveQcHold(['EXT', 'TEST', 'PACK'])).toBe(false)
  })

  it('treats QC matching as exact (case-sensitive)', () => {
    expect(canApproveQcHold(['qc'])).toBe(false)
    expect(canApproveQcHold(['Qc'])).toBe(false)
  })
})

describe('triggersQualityHold', () => {
  it('returns true on NOK for a quality_control step', () => {
    expect(triggersQualityHold('quality_control', 'nok')).toBe(true)
  })

  it('returns false on OK regardless of category', () => {
    expect(triggersQualityHold('quality_control', 'ok')).toBe(false)
    expect(triggersQualityHold('production', 'ok')).toBe(false)
  })

  it('returns false on NOK for a non-QC step', () => {
    expect(triggersQualityHold('production', 'nok')).toBe(false)
    expect(triggersQualityHold('logistics', 'nok')).toBe(false)
  })
})

describe('pickNokEvent', () => {
  it('REQUEST_QC for quality_control steps', () => {
    expect(pickNokEvent('quality_control')).toBe('REQUEST_QC')
  })

  it('COMPLETE_NOK for non-QC steps', () => {
    expect(pickNokEvent('production')).toBe('COMPLETE_NOK')
    expect(pickNokEvent('identification')).toBe('COMPLETE_NOK')
    expect(pickNokEvent('logistics')).toBe('COMPLETE_NOK')
  })
})
