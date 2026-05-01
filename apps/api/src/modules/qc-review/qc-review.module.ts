import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { WorkOrdersModule } from '../work-orders/work-orders.module'
import { QcReviewController } from './qc-review.controller'
import { QcReviewService } from './qc-review.service'

@Module({
  imports: [PrismaModule, AuthModule, WorkOrdersModule],
  controllers: [QcReviewController],
  providers: [QcReviewService],
  exports: [QcReviewService],
})
export class QcReviewModule {}
