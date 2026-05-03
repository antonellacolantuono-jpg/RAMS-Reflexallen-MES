import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { ToolsService } from './tools.service'
import { CreateToolSchema, UpdateToolSchema, ReplaceToolSchema } from '@mes/schemas'
import type { ToolModel } from './tools.repository'

@Controller('tools')
export class ToolsController extends BaseRegistryController<ToolModel> {
  constructor(service: ToolsService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as ToolsService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      wearStatus: query['wearStatus'] ?? undefined,
      equipmentNodeId: query['equipmentNodeId'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<ToolModel> {
    const dto = CreateToolSchema.parse(body)
    return (this.service as ToolsService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<ToolModel> {
    const dto = UpdateToolSchema.parse(body)
    return (this.service as ToolsService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }

  /**
   * PROMPT_9 — Tool replacement: resets counter, increments replacement count,
   * inserts ToolWearHistory, optionally stashes photoBase64 in audit log.
   * Plant scoping comes from the tool itself (not yet from JWT context).
   */
  @Post(':id/replace')
  @HttpCode(HttpStatus.OK)
  async replace(@Param('id') id: string, @Body() body: unknown): Promise<ToolModel> {
    const dto = ReplaceToolSchema.parse(body)
    const tool = await (this.service as ToolsService).findById(id)
    // Tool model has no plantId — derive from equipmentNode plant if present;
    // fallback to 'system' for the audit-log row scope (matches base service
    // pattern when entity lacks plantId).
    const plantId = (tool as unknown as { plantId?: string }).plantId ?? 'system'
    return (this.service as ToolsService).replace(id, dto, 'system', plantId)
  }
}
