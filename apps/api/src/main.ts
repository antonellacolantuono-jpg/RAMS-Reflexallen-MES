import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  // PROMPT_PNE_3 D1 — production builds must explicitly opt in or out of
  // DEMO_MODE. Refusing to boot when it's unset forces ops to make the choice
  // intentionally and prevents the mock device simulators from accidentally
  // running on a real plant.
  if (process.env['NODE_ENV'] === 'production' && process.env['DEMO_MODE'] === undefined) {
    throw new Error(
      'DEMO_MODE must be explicitly set to "true" or "false" in production builds',
    )
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  app.setGlobalPrefix('api')
  app.use(cookieParser())
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
