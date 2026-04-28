import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] })
  const port = parseInt(process.env['API_PORT'] ?? '3000', 10)
  await app.listen(port)
  console.log(`API running on http://localhost:${port}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start API', err)
  process.exit(1)
})
