import { Module } from '@nestjs/common'
import { SkillsController } from './skills.controller'
import { SkillsService } from './skills.service'
import { SkillsRepository } from './skills.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [AuditLogModule, EventsModule],
  controllers: [SkillsController],
  providers: [SkillsService, SkillsRepository],
  exports: [SkillsService],
})
export class SkillsModule {}
