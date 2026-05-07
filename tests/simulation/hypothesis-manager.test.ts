import { describe, it, expect } from "vitest";
import { HypothesisManager, Hypothesis, PredictedState, ResourceUsage } from "../src/simulation/hypothesis-manager.js";

describe("HypothesisManager", () => {
    it("should initialize correctly and manage hypotheses", async () => {
        const manager = new HypothesisManager();
        expect(manager).toBeInstanceOf(HypothesisManager);
        expect(manager.getHypotheses()).toEqual([]);

        const hypothesis1: Hypothesis = {
            plan: { action: "A" },
            context: { initial: true },
        };
        const hypothesis2: Hypothesis = {
            plan: { action: "B" },
            context: { initial: false },
        };

        await manager.addHypothesis(hypothesis1);
        await manager.addHypothesis(hypothesis2);

        const hypotheses = manager.getHypotheses();
        expect(hypotheses).toHaveLength(2);
        expect(hypotheses).toEqual([hypothesis1, hypothesis2]);
    });

    it("should generate a report containing predicted state and resource usage", async () => {
        const manager = new HypothesisManager();
        const hypothesis: Hypothesis = {
            plan: { action: "Test" },
            context: { initial: "data" },
        };

        // Mock dependencies for testing the report generation logic
        // In a real scenario, these would be properly mocked or handled by the class structure.
        // Assuming the manager uses internal logic or injected services.
        // For this test, we focus on the expected output structure.

        // Simulate the process of generating a report
        const report = await manager.generateReport(hypothesis);

        expect(report).toBeDefined();
        expect(report).toHaveProperty("predictedState");
        expect(report).toHaveProperty("resourceUsage");

        const predictedState = report.predictedState;
        expect(predictedState).toHaveProperty("stateUpdates");
        expect(predictedState).toHaveProperty("finalState");

        const resourceUsage = report.resourceUsage;
        expect(resourceUsage).toHaveProperty("cost");
        expect(resourceUsage).toHaveProperty("resources");
    });

    it("should handle an empty list of hypotheses gracefully", async () => {
        const manager = new HypothesisManager();
        const hypothesis: Hypothesis = {
            plan: { action: "EmptyTest" },
            context: {},
        };

        // If the manager is designed to process multiple hypotheses,
        // we test the scenario where the input list is empty or the manager is empty.
        // Assuming generateReport can handle an empty set or returns a default/empty report.
        const report = await manager.generateReport(hypothesis, []);

        expect(report).toBeDefined();
        expect(report.predictedState.stateUpdates).toEqual({});
        expect(report.resourceUsage.cost).toBe(0);
    });
});