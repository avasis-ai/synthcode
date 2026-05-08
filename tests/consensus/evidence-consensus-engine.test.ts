import { describe, it, expect } from "vitest";
import { EvidenceConsensusEngine } from "../src/consensus/evidence-consensus-engine.js";

describe("EvidenceConsensusEngine", () => {
    it("should calculate consensus fact and aggregate confidence when evidence is consistent", () => {
        const engine = new EvidenceConsensusEngine(0.5);
        const evidence = [
            { sourceId: "A", fact: "The sky is blue", confidence: 0.9, weight: 1.0 },
            { sourceId: "B", fact: "The sky is blue", confidence: 0.8, weight: 1.0 },
            { sourceId: "C", fact: "The sky is blue", confidence: 0.7, weight: 1.0 },
        ];

        const result = engine.calculateConsensus(evidence);

        expect(result.consensusFact).toBe("The sky is blue");
        // Expected aggregate confidence: (0.9 + 0.8 + 0.7) / 3 = 2.4 / 3 = 0.8
        expect(result.aggregateConfidence).toBeCloseTo(0.8, 2);
        expect(result.conflictReport).toEqual([]);
    });

    it("should identify conflicts and generate conflict reports when evidence contradicts", () => {
        const engine = new EvidenceConsensusEngine(0.5);
        const evidence = [
            { sourceId: "A", fact: "The sky is blue", confidence: 0.9, weight: 1.0 },
            { sourceId: "B", fact: "The sky is red", confidence: 0.8, weight: 1.0 },
            { sourceId: "C", fact: "The sky is blue", confidence: 0.7, weight: 1.0 },
        ];

        const result = engine.calculateConsensus(evidence);

        expect(result.consensusFact).toBe("The sky is blue"); // Assuming the engine prioritizes the most frequent/highest confidence fact
        expect(result.conflictReport.length).toBeGreaterThan(0);
        
        // Check if the conflict report exists and contains relevant facts
        const conflict = result.conflictReport.find(c => c.factA === "The sky is blue" && c.factB === "The sky is red");
        expect(conflict).toBeDefined();
        expect(conflict!.sourcesInConflict).toContain("A");
        expect(conflict!.sourcesInConflict).toContain("B");
        expect(conflict!.resolutionRationale).toContain("Conflict detected");
    });

    it("should handle empty evidence list gracefully", () => {
        const engine = new EvidenceConsensusEngine(0.5);
        const evidence: any[] = [];

        const result = engine.calculateConsensus(evidence);

        expect(result.consensusFact).toBe("");
        expect(result.aggregateConfidence).toBe(0);
        expect(result.conflictReport).toEqual([]);
    });
});