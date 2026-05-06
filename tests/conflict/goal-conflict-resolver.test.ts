import { describe, it, expect } from "vitest";
import { GoalConflictResolver } from "../src/conflict/goal-conflict-resolver";
import { Goal, ConflictReport } from "../src/conflict/types";

describe("GoalConflictResolver", () => {
    const resolver = new GoalConflictResolver();

    it("should return no conflicts and suggest all goals when goals are compatible", () => {
        const goals: Goal[] = [
            { id: "g1", name: "Goal A", description: "Achieve A", constraints: ["C1"] },
            { id: "g2", name: "Goal B", description: "Achieve B", constraints: ["C2"] },
        ];

        const report: ConflictReport = resolver.resolve(goals);

        expect(report.conflicts).toHaveLength(0);
        expect(report.suggestedGoals).toHaveLength(2);
        expect(report.suggestedGoals.map(g => g.id)).toEqual(["g1", "g2"]);
    });

    it("should detect a conflict when goals require mutually exclusive constraints", () => {
        const goals: Goal[] = [
            { id: "g1", name: "Goal A", description: "Achieve A", constraints: ["C1"] },
            { id: "g2", name: "Goal B", description: "Achieve B", constraints: ["C2"] },
            { id: "g3", name: "Goal C", description: "Achieve C", constraints: ["C1", "C2"] }, // Conflict between g1 and g2
        ];

        const report: ConflictReport = resolver.resolve(goals);

        expect(report.conflicts).toHaveLength(1);
        expect(report.conflicts[0].conflictingGoals).toHaveLength(3);
        expect(report.conflicts[0].description).toContain("C1 and C2");
    });

    it("should suggest a merged set of goals when conflicts are detected", () => {
        const goals: Goal[] = [
            { id: "g1", name: "Goal A", description: "Achieve A", constraints: ["C1"] },
            { id: "g2", name: "Goal B", description: "Achieve B", constraints: ["C2"] },
            { id: "g3", name: "Goal C", description: "Achieve C", constraints: ["C1", "C2"] },
        ];

        const report: ConflictReport = resolver.resolve(goals);

        expect(report.conflicts).toHaveLength(1);
        // The suggested goals should ideally represent the merged/optimized set
        expect(report.suggestedGoals).toHaveLength(2);
        expect(report.suggestedGoals.map(g => g.id)).toEqual(["g1", "g2"]);
    });
});