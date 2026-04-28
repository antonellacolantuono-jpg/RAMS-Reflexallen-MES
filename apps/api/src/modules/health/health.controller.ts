import { Controller, Get } from '@nestjs/common'

interface HealthResponse {
  status: 'ok'
  db: 'sqlite'
  cache: 'memory'
  queue: 'sync'
  storage: 'local'
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      db: 'sqlite',
      cache: 'memory',
      queue: 'sync',
      storage: 'local',
    }
  }
}
