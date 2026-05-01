import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { DRY_RUN_SCHEMAS, type DryRunRuleId } from '@mes/schemas'
import { JwtAuthGuard } from '../../auth/jwt.guard'
import { AutoGenEngineService } from '../auto-gen-engine.service'

interface DryRunResult {
  ruleId: string
  code: string
  contextEcho: Record<string, unknown>
}

@Controller('auto-gen-rules')
export class DryRunController {
  constructor(private readonly engine: AutoGenEngineService) {}

  /**
   * Previews the code that the AutoGenEngine would produce for a given
   * rule + context, WITHOUT writing anything to the database. Used by
   * the /auto-gen-rules "Prova regola" UI for stakeholder demos and
   * IATF audit verification.
   */
  @Post(':id/dry-run')
  @UseGuards(JwtAuthGuard)
  async dryRun(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<DryRunResult> {
    const schema = DRY_RUN_SCHEMAS[id as DryRunRuleId]
    if (!schema) {
      throw new NotFoundException(
        `No dry-run schema for rule ${id} (valid ids: 1-7)`,
      )
    }
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const code = await this.engine.resolve(id, parsed.data)
    return {
      ruleId: id,
      code,
      contextEcho: parsed.data as Record<string, unknown>,
    }
  }
}
