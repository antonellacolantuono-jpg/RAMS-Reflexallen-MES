import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'

export type JwtPayload = {
  sub: string
  badge: string
  plantId: string
}

export type JwtAuthenticatedUser = {
  id: string
  badge: string
  plantId: string
}

const COOKIE_NAME = 'mes_jwt'

const cookieExtractor = (req: Request): string | null => {
  if (req?.cookies && typeof (req.cookies as Record<string, unknown>)[COOKIE_NAME] === 'string') {
    return (req.cookies as Record<string, string>)[COOKIE_NAME] ?? null
  }
  return null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'dev_jwt_secret_change_me',
    })
  }

  validate(payload: JwtPayload): JwtAuthenticatedUser {
    if (!payload?.sub) throw new UnauthorizedException()
    return { id: payload.sub, badge: payload.badge, plantId: payload.plantId }
  }
}
