import { describe, it, expect } from "vitest";
import { AdaptivePerformanceGovernor } from "../src/governance/adaptive-performance-governor";

describe("AdaptivePerformanceGovernor", () => {
    it("should initialize with default thresholds", () => {
        const governor = new AdaptivePerformanceGovernor();
        // Assuming internal access or a getter/method to verify defaults,
        // but since we can't modify the class, we test behavior based on defaults.
        // We'll test a basic action to ensure initialization works.
        const metric = { latencyMs: 100, costEstimate: 10, resourceUtilizationPct: 20, timestamp: Date.now() };
        const action = governor.determineAction(metric);
        expect(action).not.toBeUndefined();
    });

    it("should determine 'THROTTLE' when latency exceeds the threshold", () => {
        // Use a low threshold for easy testing
        const governor = new AdaptivePerformanceGovernor(100, 1000, 100);
        const metric = { latencyMs: 150, costEstimate: 50, resourceUtilizationPct: 50, timestamp: Date.now() };
        const action = governor.determineAction(metric);
        expect(action).toBe("THROTTLE");
    });

    it("should determine 'FALLBACK' when resource utilization is critically high", () => {
        // Use a low resource threshold for easy testing
        const governor = new AdaptivePerformanceGovernor(1000, 1000, 80);
        const metric = { latencyMs: 100, costEstimate: 50, resourceUtilizationPct: 95, timestamp: Date.now() };
        const action = governor.determineAction(metric);
        expect(action).toBe("FALLBACK");
    });
});