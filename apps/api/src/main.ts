import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  app.setGlobalPrefix('api')
  app.useGlobalFilters(new AllExceptionsFilter())

  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  })

  const port = parseInt(process.env['API_PORT'] ?? '3000', 10)
  await app.listen(port)
  console.log(`API running on http://localhost:${port}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start API', err)
  process.exit(1)
})
