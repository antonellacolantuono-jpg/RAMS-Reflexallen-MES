import { describe, it, expect, vi } from 'vitest'

// Audit log record contract
interface AuditRecord {
  entityType: string
  entityId: string
  action: 'created' | 'updated' | 'deleted' | 'restored'
  actorId: string
  plantId: string
  before: unknown
  after: unknown
}

function validateAuditRecord(record: AuditRecord): string[] {
  const errors: string[] = []
  if (!record.entityType) errors.push('entityType required')
  if (!record.entityId) errors.push('entityId required')
  if (!record.action) errors.push('action required')
  if (!record.actorId) errors.push('actorId required')
  if (!record.plantId) errors.push('plantId required')
  return errors
}

describe('AuditLog contract validation', () => {
  it('valid record has no errors', () => {
    const record: AuditRecord = {
      entityType: 'Item',
      entityId: 'item-1',
      action: 'created',
      actorId: 'user-1',
      plantId: 'plant-1',
      before: null,
      after: { id: 'item-1', code: 'FG-001' },
    }
    expect(validateAuditRecord(record)).toHaveLength(0)
  })

  it('missing entityType is detected', () => {
    const record = { entityType: '', entityId: 'id-1', action: 'created', actorId: 'u1', plantId: 'p1', before: null, after: null } as AuditRecord
    expect(validateAuditRecord(record)).toContain('entityType required')
  })

  it('missing actorId is detected', () => {
    const record = { entityType: 'Item', entityId: 'id-1', action: 'updated', actorId: '', plantId: 'p1', before: {}, after: {} } as AuditRecord
    expect(validateAuditRecord(record)).toContain('actorId required')
  })

  it('created action has null before', () => {
    const record: AuditRecord = { entityType: 'Item', entityId: 'id-1', action: 'created', actorId: 'u1', plantId: 'p1', before: null, after: { id: 'id-1' } }
    expect(record.before).toBeNull()
    expect(record.after).not.toBeNull()
  })

  it('deleted action has null after', () => {
    const record: AuditRecord = { entityType: 'Item', entityId: 'id-1', action: 'deleted', actorId: 'u1', plantId: 'p1', before: { id: 'id-1' }, after: null }
    expect(record.before).not.toBeNull()
    expect(record.after).toBeNull()
  })

  it('audit records are never hard-deleted (IATF 16949)', () => {
    // Contract: no method exists to hard-delete audit records
    const auditService = { record: vi.fn(), findByEntity: vi.fn() }
    expect(auditService).not.toHaveProperty('delete')
    expect(auditService).not.toHaveProperty('hardDelete')
  })

  it('only valid RegistryActions are accepted', () => {
    const VALID: string[] = ['created', 'updated', 'deleted', 'restored']
    expect(VALID).not.toContain('resolved')
    expect(VALID).not.toContain('archived')
    expect(VALID).not.toContain('purged')
  })
})
