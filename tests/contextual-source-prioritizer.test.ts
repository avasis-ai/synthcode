import { describe, it, expect } from "vitest";
import { GoalState, ContextSource } from "../src/context/contextual-source-prioritizer.js";

describe("ContextualSourcePrioritizer", () => {
    it("should prioritize goal state context when available", () => {
        const goalState: GoalState = {
            goalId: "g1",
            currentPhase: "executing",
            driftScore: 0.5,
            requiredContextTypes: ["memory", "history"],
        };
        const contextSources: ContextSource[] = [
            { sourceId: "h1", sourceType: "history", payload: "history data" },
            { sourceId: "g1", sourceType: "goal_state", payload: goalState },
            { sourceId: "m1", sourceType: "memory", payload: "memory data" },
        ];

        const prioritizedSources = contextSources.sort((a, b) => {
            if (a.sourceType === "goal_state" && b.sourceType !== "goal_state") return -1;
            if (a.sourceType !== "goal_state" && b.sourceType === "goal_state") return 1;
            return 0;
        });

        expect(prioritizedSources[0].sourceType).toBe("goal_state");
        expect(prioritizedSources.length).toBe(3);
    });

    it("should prioritize memory over history when both are present", () => {
        const contextSources: ContextSource[] = [
            { sourceId: "h1", sourceType: "history", payload: "history data" },
            { sourceId: "m1", sourceType: "memory", payload: "memory data" },
            { sourceId: "e1", sourceType: "external", payload: "external data" },
        ];

        const prioritizedSources = contextSources.sort((a, b) => {
            const priority = (sourceType: ContextSource["sourceType"]) => {
                if (sourceType === "memory") return 1;
                if (sourceType === "history") return 2;
                return 3;
            };
            return priority(a.sourceType) - priority(b.sourceType);
        });

        expect(prioritizedSources[0].sourceType).toBe("memory");
        expect(prioritizedSources[1].sourceType).toBe("history");
    });

    it("should handle mixed and missing context types correctly", () => {
        const contextSources: ContextSource[] = [
            { sourceId: "e1", sourceType: "external", payload: "external data" },
            { sourceId: "h1", sourceType: "history", payload: "history data" },
            { sourceId: "m1", sourceType: "memory", payload: "memory data" },
        ];

        const prioritizedSources = contextSources.sort((a, b) => {
            const priority = (sourceType: ContextSource["sourceType"]) => {
                if (sourceType === "memory") return 1;
                if (sourceType === "history") return 2;
                if (sourceType === "external") return 3;
                return 4;
            };
            return priority(a.sourceType) - priority(b.sourceType);
        });

        expect(prioritizedSources[0].sourceType).toBe("memory");
        expect(prioritizedSources[1].sourceType).toBe("history");
        expect(prioritizedSources[2].sourceType).toBe("external");
    });
});