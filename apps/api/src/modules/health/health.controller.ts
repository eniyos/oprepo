import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'oprepo-api',
      version: '0.1.0',
    };
  }

  @Get('ready')
  readiness() {
    // Future: check DB + Redis connectivity
    return { status: 'ready' };
  }
}
