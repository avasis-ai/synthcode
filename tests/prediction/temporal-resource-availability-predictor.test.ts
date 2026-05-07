import { describe, it, expect } from "vitest";
import { TemporalResourceAvailabilityPredictor } from "../src/prediction/temporal-resource-availability-predictor.js";

describe("TemporalResourceAvailabilityPredictor", () => {
    it("should correctly predict resource availability when resources are sufficient", () => {
        const predictor = new TemporalResourceAvailabilityPredictor();
        const initialCapacity: Record<string, number> = { "CPU": 10, "Memory": 50 };
        const plan: { requiredResources: { resourceType: string; minAmount: number; duration: number }[]; executionDuration: number }[] = [
            { requiredResources: [{ resourceType: "CPU", minAmount: 3, duration: 1 }], executionDuration: 2 },
            { requiredResources: [{ resourceType: "Memory", minAmount: 10, duration: 1 }], executionDuration: 3 },
        ];

        const result = predictor.predictAvailability(initialCapacity, plan);

        expect(result.isAvailable).toBe(true);
        expect(result.conflictReport).toBeUndefined();
    });

    it("should detect resource conflicts when required resources exceed capacity", () => {
        const predictor = new TemporalResourceAvailabilityPredictor();
        const initialCapacity: Record<string, number> = { "CPU": 5, "Memory": 50 };
        const plan: { requiredResources: { resourceType: string; minAmount: number; duration: number }[]; executionDuration: number }[] = [
            { requiredResources: [{ resourceType: "CPU", minAmount: 8, duration: 1 }], executionDuration: 2 },
        ];

        const result = predictor.predictAvailability(initialCapacity, plan);

        expect(result.isAvailable).toBe(false);
        expect(result.conflictReport).toBeDefined();
        expect(result.conflictReport.resourceType).toBe("CPU");
        expect(result.conflictReport.requiredAmount).toBe(8);
        expect(result.conflictReport.availableCapacity).toBe(5);
    });

    it("should handle multiple resource types and sequential conflicts", () => {
        const predictor = new TemporalResourceAvailabilityPredictor();
        const initialCapacity: Record<string, number> = { "CPU": 10, "Memory": 10 };
        const plan: { requiredResources: { resourceType: string; minAmount: number; duration: number }[]; executionDuration: number }[] = [
            { requiredResources: [{ resourceType: "CPU", minAmount: 6, duration: 1 }], executionDuration: 2 },
            { requiredResources: [{ resourceType: "Memory", minAmount: 15, duration: 1 }], executionDuration: 3 },
        ];

        const result = predictor.predictAvailability(initialCapacity, plan);

        expect(result.isAvailable).toBe(false);
        expect(result.conflictReport).toBeDefined();
        expect(result.conflictReport.resourceType).toBe("Memory");
        expect(result.conflictReport.requiredAmount).toBe(15);
        expect(result.conflictReport.availableCapacity).toBe(10);
    });
});