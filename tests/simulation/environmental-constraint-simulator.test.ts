import { describe, it, expect } from "vitest";
import { EnvironmentalConstraintSimulator } from "../src/simulation/environmental-constraint-simulator";

describe("EnvironmentalConstraintSimulator", () => {
    it("should correctly determine feasibility when all constraints are met", () => {
        const simulator = new EnvironmentalConstraintSimulator();
        const plan = [
            { actionName: "A", requiredResources: { cpu: 1, memory: 2 }, estimatedDuration: 10 },
            { actionName: "B", requiredResources: { cpu: 1, memory: 2 }, estimatedDuration: 10 },
        ];
        const environment = {
            maxLatencyMs: 100,
            apiRateLimitPerMinute: 5,
            serviceDegradationFactor: 0.9,
        };

        const result = simulator.simulate(plan, environment);

        expect(result.isFeasible).toBe(true);
    });

    it("should mark plan as infeasible due to excessive latency", () => {
        const simulator = new EnvironmentalConstraintSimulator();
        const plan = [
            { actionName: "A", requiredResources: { cpu: 1, memory: 2 }, estimatedDuration: 60 },
        ];
        const environment = {
            maxLatencyMs: 50,
            apiRateLimitPerMinute: 10,
            serviceDegradationFactor: 0.9,
        };

        const result = simulator.simulate(plan, environment);

        expect(result.isFeasible).toBe(false);
    });

    it("should adjust impact score based on service degradation factor", () => {
        const simulator = new EnvironmentalConstraintSimulator();
        const plan = [
            { actionName: "A", requiredResources: { cpu: 1, memory: 2 }, estimatedDuration: 10 },
        ];
        const environment = {
            maxLatencyMs: 100,
            apiRateLimitPerMinute: 5,
            serviceDegradationFactor: 0.5,
        };

        const result = simulator.simulate(plan, environment);

        // Assuming impact score calculation involves the degradation factor
        expect(result.impactScore).toBeCloseTo(0.5);
    });
});