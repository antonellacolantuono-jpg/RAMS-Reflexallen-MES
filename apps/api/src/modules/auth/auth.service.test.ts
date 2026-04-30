import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { hashPin } from '../operators/pin-hash.util'

type RawOperator = {
  id: string
  badge: string
  firstName: string
  lastName: string
  plantId: string
  status: string
  deletedAt: Date | null
  pinHash: string | null
}

function makePrisma(operator: RawOperator | null) {
  return {
    operator: {
      findFirst: vi.fn().mockResolvedValue(operator),
    },
  } as unknown as ConstructorParameters<typeof AuthService>[0]
}

function makeJwt() {
  return {
    signAsync: vi.fn().mockResolvedValue('signed.jwt.token'),
  } as unknown as ConstructorParameters<typeof AuthService>[1]
}

const baseOperator = (over: Partial<RawOperator> = {}): RawOperator => ({
  id: 'op-1',
  badge: 'OP-001',
  firstName: 'Marco',
  lastName: 'Rossi',
  plantId: 'plant-1',
  status: 'active',
  deletedAt: null,
  pinHash: null,
  ...over,
})

describe('AuthService.login', () => {
  let pinHash: string

  beforeEach(async () => {
    pinHash = await hashPin('1234')
  })

  it('returns token + sanitized operator on valid credentials', async () => {
    const op = baseOperator({ pinHash })
    const service = new AuthService(makePrisma(op), makeJwt())
    const result = await service.login('OP-001', '1234')
    expect(result.token).toBe('signed.jwt.token')
    expect(result.operator).toEqual({
      id: 'op-1',
      badge: 'OP-001',
      firstName: 'Marco',
      lastName: 'Rossi',
      plantId: 'plant-1',
      status: 'active',
    })
    expect((result.operator as Record<string, unknown>)['pinHash']).toBeUndefined()
  })

  it('throws UnauthorizedException for unknown badge', async () => {
    const service = new AuthService(makePrisma(null), makeJwt())
    await expect(service.login('OP-999', '1234')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('throws UnauthorizedException for wrong PIN', async () => {
    const op = baseOperator({ pinHash })
    const service = new AuthService(makePrisma(op), makeJwt())
    await expect(service.login('OP-001', '9999')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('throws UnauthorizedException when operator has no pinHash', async () => {
    const op = baseOperator({ badge: 'OP-002', pinHash: null })
    const service = new AuthService(makePrisma(op), makeJwt())
    await expect(service.login('OP-002', '1234')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('uses generic invalid_credentials message (no enumeration leak)', async () => {
    const service = new AuthService(makePrisma(null), makeJwt())
    await expect(service.login('OP-NO', '1234')).rejects.toMatchObject({
      message: 'invalid_credentials',
    })
  })
})

describe('AuthService.me', () => {
  it('returns sanitized operator by id', async () => {
    const op = baseOperator({ pinHash: 'should-not-leak' })
    const service = new AuthService(makePrisma(op), makeJwt())
    const result = await service.me('op-1')
    expect(result.id).toBe('op-1')
    expect((result as Record<string, unknown>)['pinHash']).toBeUndefined()
  })

  it('throws when operator not found', async () => {
    const service = new AuthService(makePrisma(null), makeJwt())
    await expect(service.me('missing')).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
