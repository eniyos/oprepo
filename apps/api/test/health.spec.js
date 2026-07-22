"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const health_controller_1 = require("../src/modules/health/health.controller");
describe('HealthController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
        }).compile();
        controller = module.get(health_controller_1.HealthController);
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
//# sourceMappingURL=health.spec.js.map