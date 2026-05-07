import { describe, it, expect } from "vitest";
import { GoalRefinementLoop } from "../src/planning/goal-refinement-loop";
import { Goal, ExecutionStep, RefinementContext } from "../src/planning/types";

describe("GoalRefinementLoop", () => {
    it("should successfully execute the plan on the first attempt if no failure occurs", async () => {
        const mockGoal = { id: "g1", description: "Initial goal" } as Goal;
        const mockContext: RefinementContext = { history: [], currentStep: null };
        const mockLoop = new GoalRefinementLoop(3);

        // Mock the execution function to simulate success
        const mockExecuteStep = vi.spyOn(mockLoop, "executeStep").mockResolvedValue({ success: true, steps: [{ stepId: "s1", description: "Completed" }] });

        const result = await mockLoop.run(mockGoal, mockContext, mockExecuteStep);

        expect(result.success).toBe(true);
        expect(mockExecuteStep).toHaveBeenCalledTimes(1);
    });

    it("should refine and retry the plan if the first execution fails but subsequent attempts succeed", async () => {
        const mockGoal = { id: "g2", description: "Goal needing refinement" } as Goal;
        const mockContext: RefinementContext = { history: [], currentStep: null };
        const mockLoop = new GoalRefinementLoop(3);

        // Mock the execution function: Fail on first call, succeed on second
        const mockExecuteStep = vi.spyOn(mockLoop, "executeStep")
            .mockResolvedValueOnce({ success: false, deviation: "Insufficient resources" })
            .mockResolvedValueOnce({ success: true, steps: [{ stepId: "s2", description: "Successfully completed after refinement" }] });

        const result = await mockLoop.run(mockGoal, mockContext, mockExecuteStep);

        expect(result.success).toBe(true);
        expect(mockExecuteStep).toHaveBeenCalledTimes(2);
    });

    it("should fail gracefully after exhausting all allowed retries", async () => {
        const mockGoal = { id: "g3", description: "Goal requiring too many retries" } as Goal;
        const mockContext: RefinementContext = { history: [], currentStep: null };
        const mockLoop = new GoalRefinementLoop(2); // Set max retries to 2

        // Mock the execution function to always fail
        const mockExecuteStep = vi.spyOn(mockLoop, "executeStep").mockResolvedValue({ success: false, deviation: "Failure always" });

        const result = await mockLoop.run(mockGoal, mockContext, mockExecuteStep);

        expect(result.success).toBe(false);
        expect(result.lastDeviation).toBe("Failure always");
        expect(mockExecuteStep).toHaveBeenCalledTimes(2 + 1); // Initial attempt + 2 retries
    });
});