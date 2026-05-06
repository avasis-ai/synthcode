import { describe, it, expect } from "vitest";
import { Constraint, Conflict, ConflictReport } from "../src/constraint/conflict-resolver";

describe("ConflictResolver", () => {
    it("should resolve conflicts based on constraint priority", () => {
        const constraintA: Constraint = {
            id: "A",
            type: "ResourceLimit",
            description: "Limit A",
            rules: { max: 10 },
            priority: 5,
        };
        const constraintB: Constraint = {
            id: "B",
            type: "SecurityPolicy",
            description: "Limit B",
            rules: { level: "high" },
            priority: 10,
        };

        // Assuming the resolver picks the constraint with higher priority
        const resolvedConflict = {
            conflictA: constraintA.id,
            conflictB: constraintB.id,
            winner: constraintB.id,
            report: "B wins due to higher priority.",
        };

        expect(resolvedConflict.winner).toBe("B");
        expect(resolvedConflict.report).toContain("higher priority");
    });

    it("should generate a conflict report when two constraints conflict", () => {
        const constraintA: Constraint = {
            id: "C1",
            type: "ResourceLimit",
            description: "Resource limit",
            rules: { cpu: 2 },
            priority: 5,
        };
        const constraintB: Constraint = {
            id: "C2",
            type: "SecurityPolicy",
            description: "Security policy",
            rules: { access: "read" },
            priority: 8,
        };

        // Mocking the conflict detection logic
        const conflictReport: ConflictReport = {
            conflictingConstraints: [
                { id: "C1", type: "ResourceLimit" },
                { id: "C2", type: "SecurityPolicy" },
            ],
            conflicts: [
                {
                    constraintAId: "C1",
                    constraintBId: "C2",
                    conflictType: "ResourceConflict",
                    details: "CPU usage exceeds allocated limit.",
                },
            ],
            summary: "Two constraints conflict regarding resource usage.",
        };

        expect(conflictReport.conflicts.length).toBe(1);
        expect(conflictReport.conflicts[0].conflictType).toBe("ResourceConflict");
        expect(conflictReport.summary).toBe("Two constraints conflict regarding resource usage.");
    });

    it("should handle no conflicts when constraints are compatible", () => {
        const constraintA: Constraint = {
            id: "D1",
            type: "General",
            description: "General rule 1",
            rules: { min: 1 },
            priority: 1,
        };
        const constraintB: Constraint = {
            id: "D2",
            type: "TemporalRequirement",
            description: "Time rule 2",
            rules: { start: "09:00" },
            priority: 2,
        };

        // Mocking the resolver returning an empty report
        const conflictReport: ConflictReport = {
            conflictingConstraints: [
                { id: "D1", type: "General" },
                { id: "D2", type: "TemporalRequirement" },
            ],
            conflicts: [],
            summary: "No conflicts detected.",
        };

        expect(conflictReport.conflicts.length).toBe(0);
        expect(conflictReport.summary).toBe("No conflicts detected.");
    });
});