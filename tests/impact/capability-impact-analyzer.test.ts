import { describe, it, expect } from "vitest";
import { CapabilityImpactAnalyzer } from "../src/impact/capability-impact-analyzer";

describe("CapabilityImpactAnalyzer", () => {
    it("should calculate impact scores correctly for direct dependencies", () => {
        const analyzer = new CapabilityImpactAnalyzer();
        const dependencies: { source: string; target: string; type: "schema" | "tool" | "capability"; impactScore: number }[] = [
            { source: "A", target: "B", type: "schema", impactScore: 0.8 },
            { source: "A", target: "C", type: "tool", impactScore: 0.5 },
        ];
        const result = analyzer.analyze(dependencies);
        expect(result.impactScores).toEqual(expect.arrayContaining([
            expect.objectContaining({ source: "A", target: "B", type: "schema", impactScore: 0.8 }),
            expect.objectContaining({ source: "A", target: "C", type: "tool", impactScore: 0.5 }),
        ]));
        expect(result.totalImpact).toBeCloseTo(1.3);
    });

    it("should handle empty dependency list gracefully", () => {
        const analyzer = new CapabilityImpactAnalyzer();
        const dependencies: { source: string; target: string; type: "schema" | "tool" | "capability"; impactScore: number }[] = [];
        const result = analyzer.analyze(dependencies);
        expect(result.impactScores).toEqual([]);
        expect(result.totalImpact).toBe(0);
    });

    it("should correctly calculate total impact for multiple dependencies", () => {
        const analyzer = new CapabilityImpactAnalyzer();
        const dependencies: { source: string; target: string; type: "schema" | "tool" | "capability"; impactScore: number }[] = [
            { source: "X", target: "Y", type: "capability", impactScore: 0.2 },
            { source: "Y", target: "Z", type: "schema", impactScore: 0.3 },
            { source: "X", target: "Z", type: "tool", impactScore: 0.5 },
        ];
        const result = analyzer.analyze(dependencies);
        expect(result.impactScores).toHaveLength(3);
        expect(result.totalImpact).toBeCloseTo(1.0);
    });
});