import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AutoGenEngineService } from './auto-gen-engine.service'
import { AUTO_GEN_RESOLVERS } from './interfaces/auto-gen-resolver.interface'
import { LotCodeResolver } from './resolvers/lot-code.resolver'
import { WoCodeResolver } from './resolvers/wo-code.resolver'
import { BoxCodeResolver } from './resolvers/box-code.resolver'
import { MaintenanceCodeResolver } from './resolvers/maintenance-code.resolver'
import { RecipeVersionResolver } from './resolvers/recipe-version.resolver'
import { SampleIdResolver } from './resolvers/sample-id.resolver'
import { DowntimeEventIdResolver } from './resolvers/downtime-event-id.resolver'
import { DryRunController } from './dry-run/dry-run.controller'

const RESOLVER_PROVIDERS = [
  LotCodeResolver,
  WoCodeResolver,
  BoxCodeResolver,
  MaintenanceCodeResolver,
  RecipeVersionResolver,
  SampleIdResolver,
  DowntimeEventIdResolver,
]

@Module({
  imports: [AuthModule],
  controllers: [DryRunController],
  providers: [
    ...RESOLVER_PROVIDERS,
    {
      provide: AUTO_GEN_RESOLVERS,
      useFactory: (
        lot: LotCodeResolver,
        wo: WoCodeResolver,
        box: BoxCodeResolver,
        maint: MaintenanceCodeResolver,
        recipe: RecipeVersionResolver,
        sample: SampleIdResolver,
        downtime: DowntimeEventIdResolver,
      ) => [lot, wo, box, maint, recipe, sample, downtime],
      inject: RESOLVER_PROVIDERS,
    },
    AutoGenEngineService,
  ],
  exports: [AutoGenEngineService],
})
export class AutoGenEngineModule {}
