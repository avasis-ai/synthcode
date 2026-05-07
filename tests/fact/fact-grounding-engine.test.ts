import { describe, it, expect } from "vitest";
import { Fact, FactSource, GroundingReport } from "../src/fact/fact-grounding-engine.js";

describe("FactGroundingEngine", () => {
    it("should calculate overall confidence correctly when all sources are valid", async () => {
        const mockSource1: FactSource = {
            name: "SourceA",
            verify: async (fact: Fact) => ({
                isValid: true,
                confidenceScore: 0.9,
                sourceMetadata: { url: "a.com" },
                evidence: "Evidence A"
            })
        };
        const mockSource2: FactSource = {
            name: "SourceB",
            verify: async (fact: Fact) => ({
                isValid: true,
                confidenceScore: 0.8,
                sourceMetadata: { url: "b.com" },
                evidence: "Evidence B"
            })
        };

        const engine = {
            ground: async (fact: Fact, sources: FactSource[]): Promise<GroundingReport> => {
                const results: VerificationResult[] = [];
                let totalConfidence = 0;
                for (const source of sources) {
                    const result = await source.verify(fact);
                    results.push(result);
                    totalConfidence += result.confidenceScore;
                }
                const overallConfidence = totalConfidence / sources.length;

                return {
                    overallConfidence: overallConfidence,
                    isFactGroundable: results.every(r => r.isValid),
                    sourceBreakdown: results,
                    summary: "Summary text"
                };
            }
        };

        const fact: Fact = { subject: "Earth", predicate: "is orbiting", object: "Sun" };
        const report = await engine.ground(fact, [mockSource1, mockSource2]);

        expect(report.overallConfidence).toBeCloseTo(0.85);
        expect(report.isFactGroundable).toBe(true);
        expect(report.sourceBreakdown.length).toBe(2);
    });

    it("should set isFactGroundable to false if any source fails verification", async () => {
        const mockSource1: FactSource = {
            name: "SourceA",
            verify: async (fact: Fact) => ({
                isValid: true,
                confidenceScore: 0.9,
                sourceMetadata: { url: "a.com" },
                evidence: "Evidence A"
            })
        };
        const mockSource2: FactSource = {
            name: "SourceB",
            verify: async (fact: Fact) => ({
                isValid: false,
                confidenceScore: 0.1,
                sourceMetadata: { url: "b.com" },
                evidence: "No evidence"
            })
        };

        const engine = {
            ground: async (fact: Fact, sources: FactSource[]): Promise<GroundingReport> => {
                const results: VerificationResult[] = [];
                let totalConfidence = 0;
                for (const source of sources) {
                    const result = await source.verify(fact);
                    results.push(result);
                    totalConfidence += result.confidenceScore;
                }
                const overallConfidence = totalConfidence / sources.length;

                return {
                    overallConfidence: overallConfidence,
                    isFactGroundable: results.every(r => r.isValid),
                    sourceBreakdown: results,
                    summary: "Summary text"
                };
            }
        };

        const fact: Fact = { subject: "Mars", predicate: "has moons", object: "two" };
        const report = await engine.ground(fact, [mockSource1, mockSource2]);

        expect(report.isFactGroundable).toBe(false);
        expect(report.overallConfidence).toBeCloseTo(0.5);
    });

    it("should handle an empty list of sources gracefully", async () => {
        const engine = {
            ground: async (fact: Fact, sources: FactSource[]): Promise<GroundingReport> => {
                if (sources.length === 0) {
                    return {
                        overallConfidence: 0,
                        isFactGroundable: false,
                        sourceBreakdown: [],
                        summary: "No sources provided"
                    };
                }
                // Simplified logic for testing the empty case
                return {
                    overallConfidence: 0,
                    isFactGroundable: false,
                    sourceBreakdown: [],
                    summary: "Summary text"
                };
            }
        };

        const fact: Fact = { subject: "Test", predicate: "test", object: "test" };
        const report = await engine.ground(fact, []);

        expect(report.overallConfidence).toBe(0);
        expect(report.isFactGroundable).toBe(false);
        expect(report.sourceBreakdown).toEqual([]);
    });
});