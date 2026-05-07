import { describe, it, expect, vi } from "vitest";
import { BehavioralAblationManager } from "./behavioral-ablation-manager";

describe("BehavioralAblationManager", () => {
    it("should run all provided behavioral paths and collect metrics", async () => {
        const mockPath1: BehavioralPath = async (context) => {
            return {
                result: { role: "assistant", content: "Result 1" },
                metrics: { cost: 10, latencyMs: 100, success: true, resourceUsageBytes: 1000, log: ["log1"] },
            };
        };
        const mockPath2: BehavioralPath = async (context) => {
            return {
                result: { role: "assistant", content: "Result 2" },
                metrics: { cost: 20, latencyMs: 200, success: false, resourceUsageBytes: 2000, log: ["log2"] },
            };

        const ablationManager = new BehavioralAblationManager([
            { name: "Path 1", strategy: mockPath1 },
            { name: "Path 2", strategy: mockPath2 },
        ]);

        const context = {
            initialInput: "Test input",
            history: [],
        };

        const results = await ablationManager.runAll(context);

        expect(results).toHaveLength(2);
        expect(results[0].result.content).toBe("Result 1");
        expect(results[1].result.content).toBe("Result 2");
    });

    it("should handle an empty list of behavioral paths gracefully", async () => {
        const ablationManager = new BehavioralAblationManager([]);
        const context = {
            initialInput: "Test input",
            history: [],
        };

        const results = await ablationManager.runAll(context);

        expect(results).toHaveLength(0);
    });

    it("should correctly aggregate results and metrics from multiple paths", async () => {
        const mockPath1: BehavioralPath = async (context) => {
            return {
                result: { role: "assistant", content: "Result 1" },
                metrics: { cost: 10, latencyMs: 100, success: true, resourceUsageBytes: 1000, log: ["log1"] },
            };
        };
        const mockPath2: BehavioralPath = async (context) => {
            return {
                result: { role: "assistant", content: "Result 2" },
                metrics: { cost: 20, latencyMs: 200, success: false, resourceUsageBytes: 2000, log: ["log2"] },
            };

        const ablationManager = new BehavioralAblationManager([
            { name: "Path 1", strategy: mockPath1 },
            { name: "Path 2", strategy: mockPath2 },
        ]);

        const context = {
            initialInput: "Test input",
            history: [],
        };

        const results = await ablationManager.runAll(context);

        // Check specific metrics aggregation (assuming the manager aggregates them)
        const totalCost = results.reduce((sum, r) => sum + r.metrics.cost, 0);
        const totalLatency = results.reduce((sum, r) => sum + r.metrics.latencyMs, 0);

        expect(totalCost).toBe(30);
        expect(totalLatency).toBe(300);
    });
});