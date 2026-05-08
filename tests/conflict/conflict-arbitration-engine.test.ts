import { describe, it, expect } from "vitest";
import { ConflictArbitrationEngine } from "../src/conflict/conflict-arbitration-engine";

describe("ConflictArbitrationEngine", () => {
    it("should resolve conflicts based on weighted severity and reliability", () => {
        const engine = new ConflictArbitrationEngine();

        // Conflict 1: High severity, high weight (should win)
        const conflict1: ConflictInput = {
            sourceId: "A",
            sourceName: "Reliable Source",
            conflictType: "RESOURCE",
            severity: "HIGH",
            description: "Resource conflict.",
            proposedResolution: "Use A's resolution.",
            weight: 0.9
        };

        // Conflict 2: Low severity, low weight (should lose)
        const conflict2: ConflictInput = {
            sourceId: "B",
            sourceName: "Unreliable Source",
            conflictType: "RESOURCE",
            severity: "LOW",
            description: "Minor resource conflict.",
            proposedResolution: "Use B's resolution.",
            weight: 0.3
        };

        // Simulate arbitration
        const result = engine.arbitrate([conflict1, conflict2]);

        // Expect the result to favor the higher weighted conflict (conflict1)
        expect(result.winningSourceId).toBe(conflict1.sourceId);
        expect(result.winningResolution).toBe(conflict1.proposedResolution);
    });

    it("should handle ties by prioritizing the conflict type (e.g., POLICY over GOAL)", () => {
        const engine = new ConflictArbitrationEngine();

        // Conflict 1: Medium severity, equal weight, POLICY type
        const conflict1: ConflictInput = {
            sourceId: "C",
            sourceName: "Policy Source",
            conflictType: "POLICY",
            severity: "MEDIUM",
            description: "Policy conflict.",
            proposedResolution: "Policy resolution.",
            weight: 0.7
        };

        // Conflict 2: Medium severity, equal weight, GOAL type
        const conflict2: ConflictInput = {
            sourceId: "D",
            sourceName: "Goal Source",
            conflictType: "GOAL",
            severity: "MEDIUM",
            description: "Goal conflict.",
            proposedResolution: "Goal resolution.",
            weight: 0.7
        };

        // Simulate arbitration
        const result = engine.arbitrate([conflict1, conflict2]);

        // Expect the result to favor POLICY over GOAL in a tie scenario
        expect(result.winningSourceId).toBe(conflict1.sourceId);
        expect(result.winningResolution).toBe(conflict1.proposedResolution);
    });

    it("should return a default or neutral result if no conflicts are provided", () => {
        const engine = new ConflictArbitrationEngine();
        const conflicts: ConflictInput[] = [];

        const result = engine.arbitrate(conflicts);

        // Expect default/empty values when no conflicts are present
        expect(result.winningSourceId).toBe("");
        expect(result.winningResolution).toBe("");
    });
});