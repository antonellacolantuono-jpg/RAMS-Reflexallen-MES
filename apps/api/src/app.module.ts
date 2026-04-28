import { Module } from '@nestjs/common'
import { ConfigModule } from './modules/config/config.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { HealthModule } from './modules/health/health.module'
import { AppController } from './app.controller'

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule],
  controllers: [AppController],
})
export class AppModule {}
