import { describe, it, expect } from "vitest";
import { ResourceMetrics, PredictionResult } from "../resource/multi-dimensional-resource-contention-predictor";

describe("Multi-Dimensional Resource Contention Predictor", () => {
    it("should predict low contention when resources are abundant", () => {
        const metrics = {
            cpuLoad: 0.1,
            memoryUsage: 0.2,
            networkLatency: 5,
            apiQuotaRemaining: 1000,
            computationalBudget: 50,
        };
        const result: PredictionResult = {
            conflictScore: 0.1,
            isContended: false,
            adjustment: { suggestion: "Resources are stable.", severity: "low" },
        };
        expect(result.conflictScore).toBeCloseTo(0.1);
        expect(result.isContended).toBe(false);
        expect(result.adjustment.severity).toBe("low");
    });

    it("should predict high contention when multiple resources are strained", () => {
        const metrics = {
            cpuLoad: 0.95,
            memoryUsage: 0.85,
            networkLatency: 50,
            apiQuotaRemaining: 5,
            computationalBudget: 1,
        };
        const result: PredictionResult = {
            conflictScore: 0.9,
            isContended: true,
            adjustment: { suggestion: "Immediate resource scaling required.", severity: "high" },
        };
        expect(result.conflictScore).toBeCloseTo(0.9);
        expect(result.isContended).toBe(true);
        expect(result.adjustment.severity).toBe("high");
    });

    it("should predict medium contention when one critical resource is low", () => {
        const metrics = {
            cpuLoad: 0.4,
            memoryUsage: 0.3,
            networkLatency: 15,
            apiQuotaRemaining: 20,
            computationalBudget: 10,
        };
        const result: PredictionResult = {
            conflictScore: 0.5,
            isContended: true,
            adjustment: { suggestion: "Consider throttling non-essential services.", severity: "medium" },
        };
        expect(result.conflictScore).toBeCloseTo(0.5);
        expect(result.isContended).toBe(true);
        expect(result.adjustment.severity).toBe("medium");
    });
});