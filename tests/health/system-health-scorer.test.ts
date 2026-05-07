import { describe, it, expect } from "vitest";
import { SystemHealthScorer, MetricInput } from "../src/health/system-health-scorer";

describe("SystemHealthScorer", () => {
    it("should return 0.0 when no metrics are provided", () => {
        const scorer = new SystemHealthScorer();
        const score = scorer.calculateScore([]);
        expect(score).toBe(0.0);
    });

    it("should correctly calculate the score for a single metric", () => {
        const scorer = new SystemHealthScorer();
        const metrics: MetricInput[] = [
            { value: 0.9, type: "latency", weight: 0.5, decayRate: 0.1 }
        ];
        // Expected calculation: 0.9 * 0.5 = 0.45
        const score = scorer.calculateScore(metrics);
        expect(score).toBeCloseTo(0.45);
    });

    it("should calculate the weighted score for multiple metrics", () => {
        const scorer = new SystemHealthScorer();
        const metrics: MetricInput[] = [
            { value: 0.8, type: "latency", weight: 0.6, decayRate: 0.1 },
            { value: 0.5, type: "cost", weight: 0.4, decayRate: 0.2 }
        ];
        // Expected calculation: (0.8 * 0.6) + (0.5 * 0.4) = 0.48 + 0.2 = 0.68
        const score = scorer.calculateScore(metrics);
        expect(score).toBeCloseTo(0.68);
    });
});