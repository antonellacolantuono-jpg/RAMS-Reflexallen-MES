import { Module } from '@nestjs/common'
import { ConfigModule } from './modules/config/config.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { HealthModule } from './modules/health/health.module'
import { AuditLogModule } from './modules/audit-log/audit-log.module'
import { EventsModule } from './modules/events/events.module'
import { ItemsModule } from './modules/items/items.module'
import { BomModule } from './modules/bom/bom.module'
import { EquipmentModule } from './modules/equipment/equipment.module'
import { RecipesModule } from './modules/recipes/recipes.module'
import { SkillsModule } from './modules/skills/skills.module'
import { OperatorsModule } from './modules/operators/operators.module'
import { AuthModule } from './modules/auth/auth.module'
import { WorkOrdersModule } from './modules/work-orders/work-orders.module'
import { QcReviewModule } from './modules/qc-review/qc-review.module'
import { CauseCodesModule } from './modules/cause-codes/cause-codes.module'
import { AttentionPointsModule } from './modules/attention-points/attention-points.module'
import { ToolsModule } from './modules/tools/tools.module'
import { BoxTypesModule } from './modules/box-types/box-types.module'
import { BoxesModule } from './modules/boxes/boxes.module'
import { AutoGenRulesModule } from './modules/auto-gen-rules/auto-gen-rules.module'
import { WorkflowsModule } from './modules/workflows/workflows.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HealthModule,
    AuditLogModule,
    EventsModule,
    ItemsModule,
    BomModule,
    EquipmentModule,
    RecipesModule,
    SkillsModule,
    OperatorsModule,
    AuthModule,
    WorkOrdersModule,
    QcReviewModule,
    CauseCodesModule,
    AttentionPointsModule,
    ToolsModule,
    BoxTypesModule,
    BoxesModule,
    AutoGenRulesModule,
    WorkflowsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
