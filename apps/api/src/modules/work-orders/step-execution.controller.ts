import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt.guard'
import type { JwtAuthenticatedUser } from '../auth/jwt.strategy'
import { StepExecutionService } from './step-execution.service'

@Controller('work-orders')
export class StepExecutionController {
  constructor(private readonly service: StepExecutionService) {}

  @Get(':id/steps')
  @UseGuards(JwtAuthGuard)
  async getSteps(@Req() req: Request, @Param('id') workOrderId: string) {
    const user = req.user as JwtAuthenticatedUser
    const steps = await this.service.findStepsForWorkOrder(workOrderId, user.plantId)
    return { steps }
  }

  @Get(':id/steps/:stepExecId/state')
  @UseGuards(JwtAuthGuard)
  async getState(
    @Req() req: Request,
    @Param('id') _workOrderId: string,
    @Param('stepExecId') stepExecId: string,
  ) {
    const user = req.user as JwtAuthenticatedUser
    const state = await this.service.getState(stepExecId, user.plantId)
    return { state }
  }

  @Post(':id/steps/:stepExecId/transitions')
  @UseGuards(JwtAuthGuard)
  async transition(
    @Req() req: Request,
    @Param('id') workOrderId: string,
    @Param('stepExecId') stepExecId: string,
    @Body() body: unknown,
  ) {
    const user = req.user as JwtAuthenticatedUser
    const event =
      body && typeof body === 'object' && 'event' in body
        ? (body as { event: unknown }).event
        : body
    const result = await this.service.applyTransition({
      stepExecutionId: stepExecId,
      workOrderId,
      event,
      changedBy: user.id,
      plantId: user.plantId,
    })
    return { result }
  }
}
