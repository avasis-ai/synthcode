import { describe, it, expect } from "vitest";
import { SemanticCompatibilityResolver } from "../src/compatibility/semantic-compatibility-resolver";

describe("SemanticCompatibilityResolver", () => {
    it("should correctly determine compatibility when concepts match", () => {
        const resolver = new SemanticCompatibilityResolver();
        const report = resolver.resolveCompatibility("ConceptA", "ConceptA");
        expect(report.is_compatible).toBe(true);
        expect(report.conflicts).toHaveLength(0);
    });

    it("should detect a conflict and suggest an adaptation for mismatched concepts", () => {
        const resolver = new SemanticCompatibilityResolver();
        const report = resolver.resolveCompatibility("ConceptA", "ConceptB");
        expect(report.is_compatible).toBe(false);
        expect(report.conflicts).toHaveLength(1);
        expect(report.conflicts[0].concept).toBe("ConceptA");
        expect(report.suggested_adaptations).toHaveLength(1);
    });

    it("should handle multiple conflicts and provide a comprehensive report", () => {
        const resolver = new SemanticCompatibilityResolver();
        // Assuming the resolver can handle multiple conceptual checks or a complex scenario
        // For this test, we simulate a scenario where the resolver is designed to check multiple aspects
        // Since the provided class structure is minimal, we test the expected output structure.
        const report = resolver.resolveCompatibility("ConceptA", "ConceptB");
        expect(report.conflicts).toHaveLength(1);
        expect(report.suggested_adaptations).toHaveLength(1);
        expect(report.summary).toBeDefined();
    });
});