import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { ReleaseWorkOrderSchema } from '@mes/schemas'
import { JwtAuthGuard } from '../auth/jwt.guard'
import type { JwtAuthenticatedUser } from '../auth/jwt.strategy'
import { ReleaseService } from './release.service'

@Controller('work-orders')
export class ReleaseController {
  constructor(private readonly service: ReleaseService) {}

  @Post('release')
  @UseGuards(JwtAuthGuard)
  async release(@Req() req: Request, @Body() body: unknown) {
    const parsed = ReleaseWorkOrderSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const user = req.user as JwtAuthenticatedUser
    const result = await this.service.release({
      workflowId: parsed.data.workflowId,
      itemId: parsed.data.itemId,
      quantity: parsed.data.quantity,
      assignedOperatorId: parsed.data.assignedOperatorId,
      assignedShiftId: parsed.data.assignedShiftId ?? null,
      priority: parsed.data.priority,
      releasedBy: user.id,
      plantId: user.plantId,
    })
    return { result }
  }
}
