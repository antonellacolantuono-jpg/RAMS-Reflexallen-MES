import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { ItemsService } from './items.service'
import { CreateItemSchema, UpdateItemSchema } from '@mes/schemas'
import type { ItemModel } from './items.repository'

@Controller('items')
export class ItemsController extends BaseRegistryController<ItemModel> {
  constructor(
    service: ItemsService,
    auditLog: AuditLogService,
  ) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as ItemsService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      isActive: query['isActive'] !== 'false',
      plantId: query['plantId'] ?? undefined,
      itemType: query['itemType'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<ItemModel> {
    const dto = CreateItemSchema.parse(body)
    return (this.service as ItemsService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<ItemModel> {
    const dto = UpdateItemSchema.parse(body)
    return (this.service as ItemsService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }

  @Get(':id/where-used')
  async whereUsed(@Param('id') id: string) {
    // BOMLine.componentId → BOM.item (the parent item that uses this component)
    const lines = await (this.service as ItemsService)['prisma'].bOMLine.findMany({
      where: { componentId: id },
      include: { bom: { include: { item: { select: { id: true, code: true, name: true } } } } },
    })
    return lines.map((line: {
      bom: { id: string; item: { id: string; code: string; name: string } }
      qty: number
      uom: string
    }) => ({
      bomId: line.bom.id,
      parentItemId: line.bom.item.id,
      parentItemCode: line.bom.item.code,
      parentItemName: line.bom.item.name,
      quantity: line.qty,
      uom: line.uom,
    }))
  }
}
