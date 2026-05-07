import { describe, it, expect, vi } from "vitest";
import { PromptCanaryManager } from "../src/prompt/prompt-canary-manager";

describe("PromptCanaryManager", () => {
    it("should initialize correctly with provided versions and metrics", () => {
        const versions = [
            { id: "v1", template: "template1", weight: 0.8 },
            { id: "v2", template: "template2", weight: 0.2 },
        ];
        const metrics = {
            totalRequests: 100,
            successfulRequests: 90,
            totalLatencyMs: 5000,
            averageLatencyMs: 50,
            totalCost: 10.5,
            successRate: 0.9,
        };

        const manager = new PromptCanaryManager(versions, metrics);

        expect(manager).toBeDefined();
        expect(manager.getVersions()).toHaveLength(2);
        expect(manager.getMetrics()).toEqual(metrics);
    });

    it("should select the correct version based on weights and a given user ID", () => {
        const versions = [
            { id: "v_low", template: "low_weight", weight: 0.1 },
            { id: "v_high", template: "high_weight", weight: 0.9 },
        ];
        const metrics = {
            totalRequests: 1,
            successfulRequests: 1,
            totalLatencyMs: 0,
            averageLatencyMs: 0,
            totalCost: 0,
            successRate: 1.0,
        };

        const manager = new PromptCanaryManager(versions, metrics);

        // Mock Math.random to ensure predictable selection
        vi.spyOn(Math, 'random').mockReturnValue(0.05); // Should select v_low (0.1 weight)
        const selectedVersionId = manager.getVersionId("user_123");
        expect(selectedVersionId).toBe("v_low");

        vi.spyOn(Math, 'random').mockReturnValue(0.95); // Should select v_high (0.9 weight)
        const selectedVersionId2 = manager.getVersionId("user_456");
        expect(selectedVersionId2).toBe("v_high");
    });

    it("should update metrics correctly after a request", () => {
        const versions = [
            { id: "v1", template: "template1", weight: 1.0 },
        ];
        const initialMetrics = {
            totalRequests: 10,
            successfulRequests: 8,
            totalLatencyMs: 5000,
            averageLatencyMs: 50,
            totalCost: 10.0,
            successRate: 0.8,
        };

        const manager = new PromptCanaryManager(versions, initialMetrics);

        // Simulate a successful request
        manager.recordRequest(true, 100, 50, 0.5);

        // Simulate a failed request
        manager.recordRequest(false, 100, 10, 0.1);

        const updatedMetrics = manager.getMetrics();

        expect(updatedMetrics.totalRequests).toBe(12);
        expect(updatedMetrics.successfulRequests).toBe(9);
        expect(updatedMetrics.totalLatencyMs).toBe(5000 + 100 + 10);
        expect(updatedMetrics.totalCost).toBe(10.0 + 0.5 + 0.1);
        expect(updatedMetrics.successRate).toBeCloseTo(9 / 12, 2);
    });
});