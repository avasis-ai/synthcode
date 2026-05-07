import { describe, it, expect } from "vitest";
import { Resolver, Triple } from "../src/conflict/knowledge-graph-conflict-resolver";

describe("KnowledgeGraphConflictResolver", () => {
    it("should resolve a simple conflict by keeping the first valid triple", () => {
        const resolver = new Resolver();
        const conflictingTriples: Triple[] = [
            { subject: "A", predicate: "hasRelation", object: "X" },
            { subject: "A", predicate: "hasRelation", object: "Y" },
        ];
        const report = resolver.resolve(conflictingTriples);

        expect(report.resolvedTriples).toHaveLength(1);
        expect(report.resolvedTriples[0]).toEqual({ subject: "A", predicate: "hasRelation", object: "X" });
        expect(report.unresolvedConflicts).toHaveLength(1);
        expect(report.unresolvedConflicts[0]).toEqual({ subject: "A", predicate: "hasRelation", object: "Y" });
    });

    it("should handle no conflicts gracefully", () => {
        const resolver = new Resolver();
        const nonConflictingTriples: Triple[] = [
            { subject: "A", predicate: "hasRelation", object: "X" },
            { subject: "B", predicate: "hasRelation", object: "Y" },
        ];
        const report = resolver.resolve(nonConflictingTriples);

        expect(report.resolvedTriples).toHaveLength(2);
        expect(report.unresolvedConflicts).toHaveLength(0);
    });

    it("should identify and report all unresolved conflicts", () => {
        const resolver = new Resolver();
        const conflictingTriples: Triple[] = [
            { subject: "A", predicate: "hasRelation", object: "X" },
            { subject: "A", predicate: "hasRelation", object: "Y" },
            { subject: "B", predicate: "hasRelation", object: "Z" },
        ];
        // Assuming the resolver keeps the first one (X) and flags the rest (Y) as conflicts
        const report = resolver.resolve(conflictingTriples);

        expect(report.resolvedTriples).toHaveLength(1);
        expect(report.resolvedTriples[0]).toEqual({ subject: "A", predicate: "hasRelation", object: "X" });
        expect(report.unresolvedConflicts).toHaveLength(1);
        expect(report.unresolvedConflicts[0]).toEqual({ subject: "A", predicate: "hasRelation", object: "Y" });
    });
});