import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { BoxTypesService } from './box-types.service'
import { CreateBoxTypeSchema, UpdateBoxTypeSchema } from '@mes/schemas'
import type { BoxTypeModel } from './box-types.repository'

@Controller('box-types')
export class BoxTypesController extends BaseRegistryController<BoxTypeModel> {
  constructor(service: BoxTypesService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as BoxTypesService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<BoxTypeModel> {
    const dto = CreateBoxTypeSchema.parse(body)
    return (this.service as BoxTypesService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<BoxTypeModel> {
    const dto = UpdateBoxTypeSchema.parse(body)
    return (this.service as BoxTypesService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }
}
