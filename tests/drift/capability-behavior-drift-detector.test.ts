import { describe, it, expect } from "vitest";
import { BehavioralProfile, BehavioralDriftReport } from "../src/drift/capability-behavior-drift-detector.js";

describe("BehavioralProfile", () => {
    it("should correctly calculate a drift report when no significant drift is detected", () => {
        const profile = new BehavioralProfile({
            fieldStats: {
                "fieldA": { count: 10, sum: 50, sumOfSquares: 2500, mean: 5, stdDev: 5 },
                "fieldB": { count: 10, sum: 100, sumOfSquares: 10000, mean: 10, stdDev: 10 },
            },
        });

        const report = profile.detectDrift({
            fieldStats: {
                "fieldA": { count: 10, sum: 50, sumOfSquares: 2500, mean: 5, stdDev: 5 },
                "fieldB": { count: 10, sum: 100, sumOfSquares: 10000, mean: 10, stdDev: 10 },
            },
        });

        expect(report.isDrifting).toBe(false);
        expect(report.driftScore).toBeCloseTo(0);
        expect(report.details).toEqual({});
    });

    it("should detect drift when a field's mean significantly changes", () => {
        const profile = new BehavioralProfile({
            fieldStats: {
                "fieldA": { count: 10, sum: 50, sumOfSquares: 2500, mean: 5, stdDev: 5 },
            },
        });

        const driftData = {
            fieldStats: {
                "fieldA": { count: 10, sum: 100, sumOfSquares: 5000, mean: 10, stdDev: 10 }, // Mean changed from 5 to 10
            },
        };

        const report = profile.detectDrift(driftData);

        expect(report.isDrifting).toBe(true);
        expect(report.driftScore).toBeGreaterThan(0);
        expect(report.details["fieldA"]).toContain("mean");
    });

    it("should handle empty input data gracefully", () => {
        const profile = new BehavioralProfile({
            fieldStats: {},
        });

        const report = profile.detectDrift({
            fieldStats: {},
        });

        expect(report.isDrifting).toBe(false);
        expect(report.driftScore).toBe(0);
        expect(report.details).toEqual({});
    });
});