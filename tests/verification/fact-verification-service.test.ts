import { describe, it, expect } from "vitest";
import { FactVerificationService } from "../src/verification/fact-verification-service";

describe("FactVerificationService", () => {
    it("should return a high confidence score when all evidence is consistent and credible", async () => {
        const service = new FactVerificationService();
        const claim = "The Earth is a planet.";
        const evidence = [
            { sourceId: "NASA", content: "Earth is a planet.", reliabilityScore: 0.9, isConflicting: false },
            { sourceId: "Wikipedia", content: "Earth is a planet.", reliabilityScore: 0.8, isConflicting: false },
        ];
        const sources = [
            { sourceId: "NASA", credibilityScore: 0.95, notes: "Highly reliable space agency." },
            { sourceId: "Wikipedia", credibilityScore: 0.8, notes: "General knowledge base." },
        ];

        const report = await service.verifyFact(claim, evidence, sources);

        expect(report.veracityStatus).toBe("VERIFIED");
        expect(report.confidenceScore).toBeGreaterThan(0.85);
    });

    it("should return a low confidence score and UNVERIFIED status when evidence is conflicting", async () => {
        const service = new FactVerificationService();
        const claim = "The capital of France is Paris.";
        const evidence = [
            { sourceId: "SourceA", content: "The capital is Paris.", reliabilityScore: 0.9, isConflicting: false },
            { sourceId: "SourceB", content: "The capital is Lyon.", reliabilityScore: 0.9, isConflicting: true },
        ];
        const sources = [
            { sourceId: "SourceA", credibilityScore: 0.7, notes: "Unknown source." },
            { sourceId: "SourceB", credibilityScore: 0.7, notes: "Unknown source." },
        ];

        const report = await service.verifyFact(claim, evidence, sources);

        expect(report.veracityStatus).toBe("CONFLICTING");
        expect(report.confidenceScore).toBeLessThan(0.5);
    });

    it("should return a partially verified status when evidence is mixed but not fully contradictory", async () => {
        const service = new FactVerificationService();
        const claim = "The largest ocean is the Pacific Ocean.";
        const evidence = [
            { sourceId: "SourceX", content: "The largest ocean is the Pacific.", reliabilityScore: 0.9, isConflicting: false },
            { sourceId: "SourceY", content: "The largest ocean is the Atlantic.", reliabilityScore: 0.6, isConflicting: false },
        ];
        const sources = [
            { sourceId: "SourceX", credibilityScore: 0.9, notes: "Geographical journal." },
            { sourceId: "SourceY", credibilityScore: 0.5, notes: "Blog post." },
        ];

        const report = await service.verifyFact(claim, evidence, sources);

        expect(report.veracityStatus).toBe("PARTIALLY_VERIFIED");
        expect(report.confidenceScore).toBeGreaterThan(0.5);
        expect(report.confidenceScore).toBeLessThan(0.85);
    });
});