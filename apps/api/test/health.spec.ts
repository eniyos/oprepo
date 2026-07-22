import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return status ok', () => {
    const result = controller.check();
    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('service', 'oprepo-api');
    expect(result).toHaveProperty('version', '0.1.0');
    expect(result).toHaveProperty('timestamp');
  });

  it('should report readiness', () => {
    const result = controller.readiness();
    expect(result).toHaveProperty('status', 'ready');
  });
});
