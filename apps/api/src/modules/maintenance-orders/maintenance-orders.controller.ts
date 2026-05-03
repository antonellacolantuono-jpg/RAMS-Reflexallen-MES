import {
  Controller,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Post,
  Patch,
  Delete,
  Query,
} from '@nestjs/common'
import { BaseRegistryController } from '../../common/base-registry.controller'
import { AuditLogService } from '../audit-log/audit-log.service'
import { MaintenanceOrdersService } from './maintenance-orders.service'
import {
  CreateMaintenanceOrderSchema,
  UpdateMaintenanceOrderSchema,
} from '@mes/schemas'
import type { MaintenanceOrderModel } from './maintenance-orders.repository'

@Controller('maintenance-orders')
export class MaintenanceOrdersController extends BaseRegistryController<MaintenanceOrderModel> {
  constructor(service: MaintenanceOrdersService, auditLog: AuditLogService) {
    super(service, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return (this.service as MaintenanceOrdersService).findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      isActive: query['isActive'] !== 'false',
      plantId: query['plantId'] ?? undefined,
      status: query['status'] ?? undefined,
      type: query['type'] ?? undefined,
      priority: query['priority'] ?? undefined,
      equipmentNodeId: query['equipmentNodeId'] ?? undefined,
    })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: unknown): Promise<MaintenanceOrderModel> {
    const dto = CreateMaintenanceOrderSchema.parse(body)
    return (this.service as MaintenanceOrdersService).create(dto, 'system')
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): Promise<MaintenanceOrderModel> {
    const dto = UpdateMaintenanceOrderSchema.parse(body)
    return (this.service as MaintenanceOrdersService).update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.service.softDelete(id, 'system')
  }
}
