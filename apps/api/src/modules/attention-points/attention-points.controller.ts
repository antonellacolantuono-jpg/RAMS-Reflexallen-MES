import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { AttentionPointsService } from './attention-points.service'
import { CreateAttentionPointSchema, ResolveAttentionPointSchema } from '@mes/schemas'
import type { AttentionPointModel } from './attention-points.service'
import type { PaginatedResult } from '../../common/types/paginated'

@Controller('attention-points')
export class AttentionPointsController {
  constructor(private readonly service: AttentionPointsService) {}

  @Get()
  findAll(@Query() query: Record<string, string>): Promise<PaginatedResult<AttentionPointModel>> {
    return this.service.findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
      entityType: query['entityType'] ?? undefined,
      severity: query['severity'] ?? undefined,
      resolved: query['resolved'] !== undefined ? query['resolved'] === 'true' : undefined,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AttentionPointModel> {
    return this.service.findById(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<AttentionPointModel> {
    const dto = CreateAttentionPointSchema.parse(body)
    return this.service.create(dto, 'system')
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  resolve(@Param('id') id: string, @Body() body: unknown): Promise<AttentionPointModel> {
    const dto = ResolveAttentionPointSchema.parse(body)
    return this.service.resolve(id, dto.resolveNote ?? '', dto.resolvedBy)
  }
}
