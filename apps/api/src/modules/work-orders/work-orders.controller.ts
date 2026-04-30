import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import type { JwtAuthenticatedUser } from '../auth/jwt.strategy'
import { WorkOrdersService } from './work-orders.service'

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMine(@Req() req: Request) {
    const user = req.user as JwtAuthenticatedUser
    const workOrders = await this.service.findMine(user.id)
    return { workOrders }
  }
}
