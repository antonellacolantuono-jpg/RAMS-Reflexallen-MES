import { describe, it, expect } from 'vitest'
import { mapPromptStatus } from '../workflow-v0-empty'

describe('PROMPT-spec status → schema enum mapping', () => {
  it('maps Active → approved, Draft → draft, Deprecated → deprecated', () => {
    expect(mapPromptStatus('Active')).toBe('approved')
    expect(mapPromptStatus('Draft')).toBe('draft')
    expect(mapPromptStatus('Deprecated')).toBe('deprecated')
  })

  it('throws on unknown PROMPT status (exhaustive check)', () => {
    // @ts-expect-error — intentionally passing an invalid value to verify runtime guard
    expect(() => mapPromptStatus('Invalid')).toThrow(/Unknown PROMPT status/)
  })
})
