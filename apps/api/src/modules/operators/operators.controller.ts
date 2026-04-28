import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { OperatorsService } from './operators.service'
import { CreateOperatorSchema, UpdateOperatorSchema } from '@mes/schemas'
import type { OperatorModel } from './operators.repository'

@Controller('operators')
export class OperatorsController extends BaseRegistryController<OperatorModel> {
  constructor(service: OperatorsService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as OperatorsService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      status: query['status'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<OperatorModel> {
    const dto = CreateOperatorSchema.parse(body)
    return (this.service as OperatorsService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<OperatorModel> {
    const dto = UpdateOperatorSchema.parse(body)
    return (this.service as OperatorsService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }
}
