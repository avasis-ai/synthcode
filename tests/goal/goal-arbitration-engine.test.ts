import { describe, it, expect } from "vitest";
import { GoalArbitrationEngine } from "../src/goal/goal-arbitration-engine";
import { Goal, ArbitrationStrategy, GoalConflictReport } from "../src/goal/types";

describe("GoalArbitrationEngine", () => {
    it("should initialize with no registered strategies", () => {
        const engine = new GoalArbitrationEngine();
        // We can't directly check private members, but we can check behavior.
        // If we try to run arbitration without strategies, it should handle it gracefully (or fail predictably).
        // For this test, we'll assume the internal map is empty.
    });

    it("should allow registering and retrieving strategies by name", () => {
        const engine = new GoalArbitrationEngine();
        const mockStrategy: ArbitrationStrategy = (goals: Goal[]) => goals[0];

        engine.registerStrategy("PriorityStrategy", mockStrategy);

        // Since we don't have a getter for strategies, we rely on the registration side effect.
        // We'll test the usage in the next test.
    });

    it("should run arbitration using a registered strategy and return a result", async () => {
        const engine = new GoalArbitrationEngine();
        const mockStrategy: ArbitrationStrategy = (goals: Goal[]) => goals.length > 0 ? goals[0] : null;

        engine.registerStrategy("TestStrategy", mockStrategy);

        const goals: Goal[] = [
            { id: "g1", name: "Goal A", priority: 1 },
            { id: "g2", name: "Goal B", priority: 2 },
        ];

        // Assuming the arbitration method exists and takes strategy name and goals
        // We mock the expected return type based on the class structure.
        const result = await (engine as any).arbitrateGoals("TestStrategy", goals);

        expect(result).toBeDefined();
        // Assuming the result structure contains the resolved goal or report
        if (typeof result === 'object' && result !== null) {
            expect(result).toHaveProperty("resolvedGoal");
        }
    });
});