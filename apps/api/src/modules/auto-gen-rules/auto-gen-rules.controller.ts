import { Controller, Get, Param } from '@nestjs/common'
import { AutoGenRulesService } from './auto-gen-rules.service'
import type { AutoGenRule } from './auto-gen-rules.service'

@Controller('auto-gen-rules')
export class AutoGenRulesController {
  constructor(private readonly service: AutoGenRulesService) {}

  @Get()
  findAll(): AutoGenRule[] {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string): AutoGenRule {
    return this.service.findById(id)
  }
}
