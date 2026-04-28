import {
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import type { BaseRegistryService } from './base-registry.service'
import type { AuditLogService } from '../modules/audit-log/audit-log.service'

const SYSTEM_ACTOR = 'system'

export abstract class BaseRegistryController<TModel extends { id: string; plantId?: string }> {
  constructor(
    protected readonly service: BaseRegistryService<TModel>,
    protected readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.service.findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      isActive: query['isActive'] !== 'false',
      plantId: query['plantId'] ?? undefined,
    })
  }

  @Get('trash')
  findTrashed(@Query() query: Record<string, string>) {
    return this.service.findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      isActive: false,
      plantId: query['plantId'] ?? undefined,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Get(':id/audit')
  getAudit(@Param('id') id: string, @Query() query: Record<string, string>) {
    const entityType = (this.service as unknown as { entityType: string }).entityType
    return this.auditLog.findForEntity(entityType, id, {
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '20', 10), 100),
    })
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id') id: string) {
    return this.service.restore(id, SYSTEM_ACTOR)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.softDelete(id, SYSTEM_ACTOR)
  }

  // Subclasses implement:
  abstract create(body: unknown): Promise<TModel>
  abstract update(id: string, body: unknown): Promise<TModel>
}

// Re-export decorator helpers for subclass use
export { Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus }
