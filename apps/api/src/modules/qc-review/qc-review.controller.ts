import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import type { JwtAuthenticatedUser } from '../auth/jwt.strategy'
import { QcReviewService } from './qc-review.service'

function parseRejectBody(body: unknown): { reason: string } {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException('Invalid body')
  }
  const reason = (body as { reason?: unknown }).reason
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new BadRequestException('reason is required')
  }
  if (reason.length > 2000) {
    throw new BadRequestException('reason exceeds 2000 characters')
  }
  return { reason }
}

@Controller('qc-review')
@UseGuards(JwtAuthGuard)
export class QcReviewController {
  constructor(private readonly service: QcReviewService) {}

  @Get()
  async list(@Req() req: Request) {
    const user = req.user as JwtAuthenticatedUser
    const items = await this.service.listHolds(user.plantId)
    return { items }
  }

  @Post(':stepExecId/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Req() req: Request,
    @Param('stepExecId') stepExecId: string,
  ) {
    const user = req.user as JwtAuthenticatedUser
    const result = await this.service.approve({
      stepExecutionId: stepExecId,
      approverId: user.id,
      plantId: user.plantId,
    })
    return { result }
  }

  @Post(':stepExecId/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Req() req: Request,
    @Param('stepExecId') stepExecId: string,
    @Body() body: unknown,
  ) {
    const { reason } = parseRejectBody(body)
    const user = req.user as JwtAuthenticatedUser
    const result = await this.service.reject({
      stepExecutionId: stepExecId,
      approverId: user.id,
      plantId: user.plantId,
      reason,
    })
    return { result }
  }
}
