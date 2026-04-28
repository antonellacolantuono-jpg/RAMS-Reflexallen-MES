import { Module } from '@nestjs/common'
import { AutoGenRulesController } from './auto-gen-rules.controller'
import { AutoGenRulesService } from './auto-gen-rules.service'

@Module({
  controllers: [AutoGenRulesController],
  providers: [AutoGenRulesService],
  exports: [AutoGenRulesService],
})
export class AutoGenRulesModule {}
