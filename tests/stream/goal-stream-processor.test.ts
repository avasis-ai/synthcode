import { describe, it, expect } from "vitest";
import { GoalStreamProcessor, ExternalGoal } from "../src/stream/goal-stream-processor";

describe("GoalStreamProcessor", () => {
    it("should process a single goal correctly", () => {
        const processor = new GoalStreamProcessor();
        const externalGoal: ExternalGoal = {
            goalId: "g1",
            sourceId: "s1",
            content: "Test content",
            timestamp: Date.now(),
            initialCredibility: 0.8,
        };

        const processedGoal = processor.processGoal(externalGoal);

        expect(processedGoal.goalId).toBe("g1");
        expect(processedGoal.content).toBe("Test content");
        expect(processedGoal.sourceId).toBe("s1");
        expect(processedGoal.finalWeight).toBeGreaterThanOrEqual(0);
    });

    it("should calculate overall confidence score for a set of goals", () => {
        const processor = new GoalStreamProcessor();
        const goals: ExternalGoal[] = [
            {
                goalId: "g1",
                sourceId: "s1",
                content: "Goal A",
                timestamp: Date.now() - 1000,
                initialCredibility: 0.9,
            },
            {
                goalId: "g2",
                sourceId: "s2",
                content: "Goal B",
                timestamp: Date.now(),
                initialCredibility: 0.7,
            },
        ];

        const processedGoals = goals.map(goal => processor.processGoal(goal));
        const processedSet = processor.processGoalSet(processedGoals);

        expect(processedSet.goals.length).toBe(2);
        expect(processedSet.overallConfidenceScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle an empty goal set gracefully", () => {
        const processor = new GoalStreamProcessor();
        const processedGoals: GoalStreamProcessor["processGoal"] = [];
        const processedSet = processor.processGoalSet(processedGoals);

        expect(processedSet.goals).toHaveLength(0);
        expect(processedSet.overallConfidenceScore).toBe(0);
    });
});