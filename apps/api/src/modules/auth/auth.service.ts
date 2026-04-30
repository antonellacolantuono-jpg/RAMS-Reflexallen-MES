import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { verifyPin } from '../operators/pin-hash.util'

export type AuthOperator = {
  id: string
  badge: string
  firstName: string
  lastName: string
  plantId: string
  status: string
}

type RawOperator = {
  id: string
  badge: string
  firstName: string
  lastName: string
  plantId: string
  status: string
  pinHash: string | null
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(badge: string, pin: string): Promise<{ token: string; operator: AuthOperator }> {
    const operator = (await this.prisma.operator.findFirst({
      where: { badge, deletedAt: null, status: 'active' },
    })) as RawOperator | null

    if (!operator || !operator.pinHash) {
      throw new UnauthorizedException('invalid_credentials')
    }
    const ok = await verifyPin(operator.pinHash, pin)
    if (!ok) {
      throw new UnauthorizedException('invalid_credentials')
    }
    const token = await this.jwt.signAsync({
      sub: operator.id,
      badge: operator.badge,
      plantId: operator.plantId,
    })
    return { token, operator: this.sanitize(operator) }
  }

  async me(operatorId: string): Promise<AuthOperator> {
    const operator = (await this.prisma.operator.findFirst({
      where: { id: operatorId, deletedAt: null, status: 'active' },
    })) as RawOperator | null
    if (!operator) throw new UnauthorizedException()
    return this.sanitize(operator)
  }

  private sanitize(op: RawOperator): AuthOperator {
    return {
      id: op.id,
      badge: op.badge,
      firstName: op.firstName,
      lastName: op.lastName,
      plantId: op.plantId,
      status: op.status,
    }
  }
}
