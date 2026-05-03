import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import type { JwtAuthenticatedUser } from '../auth/jwt.strategy'
import { AuditLogService } from '../audit-log/audit-log.service'
import { WorkOrdersService } from './work-orders.service'

@Controller('work-orders')
export class WorkOrdersController {
  constructor(
    private readonly service: WorkOrdersService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMine(@Req() req: Request) {
    const user = req.user as JwtAuthenticatedUser
    const workOrders = await this.service.findMine(user.id)
    return { workOrders }
  }

  // PROMPT_DESIGN_ALIGNMENT D3 batch 9 — back-office detail endpoint.
  // Open (no auth guard) to mirror the registry detail controllers used by
  // /equipment/[id], /items/[id], etc. Plant-scoping is deferred until the
  // back-office gets its own auth flow (TODO-046).
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findDetail(id)
  }

  @Get(':id/audit')
  async getAudit(@Param('id') id: string) {
    return this.auditLog.findForEntity('WorkOrder', id, { page: 1, limit: 50 })
  }
}
