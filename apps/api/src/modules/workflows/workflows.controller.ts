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
import { WorkflowsService } from './workflows.service'
import {
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  UpdateWorkflowVersionSchema,
  DeprecateWorkflowVersionSchema,
  CloneWorkflowSchema,
} from '@mes/schemas'
import type { WorkflowModel } from './workflows.repository'

@Controller('workflows')
export class WorkflowsController extends BaseRegistryController<WorkflowModel> {
  constructor(
    private readonly workflowsService: WorkflowsService,
    auditLog: AuditLogService,
  ) {
    super(workflowsService, auditLog)
  }

  @Get()
  override findAll(@Query() query: Record<string, string>) {
    return this.workflowsService.findAll({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      sortBy: query['sortBy'] ?? undefined,
      sortDir: (query['sortDir'] as 'asc' | 'desc' | undefined) ?? 'desc',
      search: query['search'] ?? undefined,
      plantId: query['plantId'] ?? undefined,
    })
  }

  @Get('trash')
  findTrash(@Query() query: Record<string, string>) {
    return this.workflowsService.findAllDeleted({
      page: parseInt(query['page'] ?? '1', 10),
      limit: Math.min(parseInt(query['limit'] ?? '25', 10), 100),
      plantId: query['plantId'] ?? undefined,
      sortBy: undefined,
      sortDir: 'desc',
    })
  }

  @Get(':id')
  override findOne(@Param('id') id: string) {
    return this.workflowsService.findDetailById(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  override create(@Body() body: unknown) {
    const dto = CreateWorkflowSchema.parse(body)
    return this.workflowsService.create(dto, 'system')
  }

  @Patch(':id')
  override update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateWorkflowSchema.parse(body)
    return this.workflowsService.update(id, dto, 'system')
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  override async remove(@Param('id') id: string) {
    await this.workflowsService.softDelete(id, 'system')
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  override restore(@Param('id') id: string) {
    return this.workflowsService.restore(id, 'system')
  }

  // ── Version endpoints ───────────────────────────────────────────────────────

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.workflowsService.listVersions(id)
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  createVersion(@Param('id') id: string) {
    return this.workflowsService.createVersion(id, 'system')
  }

  @Get(':id/versions/:vid')
  findVersion(@Param('id') id: string, @Param('vid') vid: string) {
    return this.workflowsService.findVersionById(id, vid)
  }

  @Patch(':id/versions/:vid')
  updateVersion(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateWorkflowVersionSchema.parse(body)
    return this.workflowsService.updateVersion(id, vid, dto, 'system')
  }

  // ── Lifecycle transitions ──────────────────────────────────────────────────

  @Post(':id/versions/:vid/approve')
  @HttpCode(HttpStatus.OK)
  approveVersion(@Param('id') id: string, @Param('vid') vid: string) {
    return this.workflowsService.approveVersion(id, vid, 'system')
  }

  @Post(':id/versions/:vid/deprecate')
  @HttpCode(HttpStatus.OK)
  deprecateVersion(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() body: unknown,
  ) {
    const dto = DeprecateWorkflowVersionSchema.parse(body)
    return this.workflowsService.deprecateVersion(id, vid, dto.reason, 'system')
  }

  // ── Templates / clone ──────────────────────────────────────────────────────

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  clone(@Param('id') id: string, @Body() body: unknown) {
    const dto = CloneWorkflowSchema.parse(body)
    return this.workflowsService.cloneWorkflow(id, dto, 'system')
  }
}
