import { Controller, Body, Param, HttpCode, HttpStatus, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RecipesService } from './recipes.service'
import { CreateRecipeSchema, UpdateRecipeSchema } from '@mes/schemas'
import type { RecipeModel } from './recipes.repository'

@Controller('recipes')
export class RecipesController extends BaseRegistryController<RecipeModel> {
  constructor(service: RecipesService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as RecipesService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      status: query['status'] ?? undefined,
      deviceId: query['deviceId'] ?? undefined,
      itemId: query['itemId'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<RecipeModel> {
    const dto = CreateRecipeSchema.parse(body)
    return (this.service as RecipesService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<RecipeModel> {
    const dto = UpdateRecipeSchema.parse(body)
    return (this.service as RecipesService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string): Promise<RecipeModel> {
    return (this.service as RecipesService).approve(id, 'system')
  }
}
