import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { BomService } from './bom.service'
import { CreateBomSchema, UpdateBomSchema } from '@mes/schemas'
import type { BomModel } from './bom.repository'

@Controller('bom')
export class BomController extends BaseRegistryController<BomModel> {
  constructor(service: BomService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as BomService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      status: query['status'] ?? undefined,
      itemId: query['itemId'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<BomModel> {
    const dto = CreateBomSchema.parse(body)
    return (this.service as BomService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<BomModel> {
    const dto = UpdateBomSchema.parse(body)
    return (this.service as BomService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }

  @Get(':id/tree')
  async getTree(@Param('id') id: string) {
    return (this.service as BomService)['prisma'].bOMLine.findMany({
      where: { bomId: id },
      orderBy: { position: 'asc' },
    })
  }
}
