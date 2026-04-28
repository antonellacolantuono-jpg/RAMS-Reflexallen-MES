import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { CauseCodesService } from './cause-codes.service'
import { CreateCauseCodeSchema, UpdateCauseCodeSchema } from '@mes/schemas'
import type { CauseCodeModel } from './cause-codes.repository'

@Controller('cause-codes')
export class CauseCodesController extends BaseRegistryController<CauseCodeModel> {
  constructor(service: CauseCodesService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as CauseCodesService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      category: query['category'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<CauseCodeModel> {
    const dto = CreateCauseCodeSchema.parse(body)
    return (this.service as CauseCodesService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<CauseCodeModel> {
    const dto = UpdateCauseCodeSchema.parse(body)
    return (this.service as CauseCodesService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }
}
