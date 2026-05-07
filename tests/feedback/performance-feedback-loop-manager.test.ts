import { describe, it, expect } from "vitest";
import { PerformanceFeedbackLoopManager } from "../../../src/feedback/performance-feedback-loop-manager.js";

describe("PerformanceFeedbackLoopManager", () => {
    it("should initialize correctly with metrics and SLO profiles", () => {
        const metrics = [
            { toolId: "A", metric: "latency", value: 100, context: "api" },
            { toolId: "B", metric: "cost", value: 50, context: "api" },
        ];
        const sloProfile = {
            latency: { target: 150, max_acceptable: 200, min_acceptable: 50 },
            cost: { target: 75, max_acceptable: 100, min_acceptable: 25 },
        };

        const manager = new PerformanceFeedbackLoopManager(metrics, sloProfile);
        expect(manager).toBeDefined();
    });

    it("should generate an adjustment when a metric exceeds its maximum acceptable limit", () => {
        const metrics = [
            { toolId: "A", metric: "latency", value: 300, context: "api" }, // Exceeds max (200)
        ];
        const sloProfile = {
            latency: { target: 150, max_acceptable: 200, min_acceptable: 50 },
        };

        const manager = new PerformanceFeedbackLoopManager(metrics, sloProfile);
        const adjustment = manager.generateAdjustment();

        expect(adjustment).toBeDefined();
        expect(adjustment.type).toBe("weight_adjustment");
        expect(adjustment.details).toContain("latency");
    });

    it("should generate no adjustment if all metrics are within acceptable limits", () => {
        const metrics = [
            { toolId: "A", metric: "latency", value: 100, context: "api" }, // Within range (50-200)
            { toolId: "B", metric: "cost", value: 60, context: "api" },   // Within range (25-100)
        ];
        const sloProfile = {
            latency: { target: 150, max_acceptable: 200, min_acceptable: 50 },
            cost: { target: 75, max_acceptable: 100, min_acceptable: 25 },
        };

        const manager = new PerformanceFeedbackLoopManager(metrics, sloProfile);
        const adjustment = manager.generateAdjustment();

        expect(adjustment).toBeNull();
    });
});