import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import { OperatorLoginSchema } from '@mes/schemas'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt.guard'
import type { JwtAuthenticatedUser } from './jwt.strategy'

const COOKIE_NAME = 'mes_jwt'
const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict' as const,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = OperatorLoginSchema.parse(body)
    const { token, operator } = await this.auth.login(dto.badge, dto.pin)
    res.cookie(COOKIE_NAME, token, cookieOptions())
    return { operator }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 })
    return { ok: true }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = req.user as JwtAuthenticatedUser
    const operator = await this.auth.me(user.id)
    return { operator }
  }
}
