import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { EquipmentService } from './equipment.service'
import { CreateEquipmentNodeSchema, UpdateEquipmentNodeSchema } from '@mes/schemas'
import type { EquipmentModel } from './equipment.repository'

@Controller('equipment')
export class EquipmentController extends BaseRegistryController<EquipmentModel> {
  constructor(service: EquipmentService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as EquipmentService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      level: query['level'] ?? undefined,
      status: query['status'] ?? undefined,
    })
  }

  @Get('tree')
  async getTree() {
    return (this.service as EquipmentService)['prisma'].equipmentNode.findMany({
      where: { deletedAt: null },
      orderBy: { level: 'asc' },
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<EquipmentModel> {
    const dto = CreateEquipmentNodeSchema.parse(body)
    return (this.service as EquipmentService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<EquipmentModel> {
    const dto = UpdateEquipmentNodeSchema.parse(body)
    return (this.service as EquipmentService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }
}
