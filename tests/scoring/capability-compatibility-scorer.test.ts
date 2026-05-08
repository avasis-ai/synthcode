import { describe, it, expect } from "vitest"
import { CapabilityCompatibilityScorer } from "../src/scoring/capability-compatibility-scorer.js"

describe("CapabilityCompatibilityScorer", () => {
    it("should calculate a base score when all criteria are provided and within range", () => {
        const scorer = new CapabilityCompatibilityScorer();
        const capability = {
            name: "Test Cap",
            description: "Test",
            securityLevel: 4,
            performanceScore: 8,
            cost: 3,
            compatibilityScore: 0.9
        };
        const criteria = {
            security: { weight: 0.4, min: 3, max: 5 },
            performance: { weight: 0.5, min: 5, max: 10 },
            cost: { weight: 0.1, min: 0, max: 5 }
        };

        const score = scorer.calculateScore(capability, criteria);

        // Expected calculation:
        // Security: (4 - 3) / (5 - 3) * 0.4 = 0.5 * 0.4 = 0.2
        // Performance: (8 - 5) / (10 - 5) * 0.5 = 0.6 * 0.5 = 0.3
        // Cost: (3 - 0) / (5 - 0) * 0.1 = 0.6 * 0.1 = 0.06
        // Total: 0.2 + 0.3 + 0.06 = 0.56
        expect(score).toBeCloseTo(0.56, 2);
    })

    it("should handle missing criteria gracefully by ignoring them", () => {
        const scorer = new CapabilityCompatibilityScorer();
        const capability = {
            name: "Test Cap",
            description: "Test",
            securityLevel: 5,
            performanceScore: 10,
            cost: 1,
            compatibilityScore: 1.0
        };
        // Only providing security criteria
        const criteria = {
            security: { weight: 1.0, min: 1, max: 5 }
        };

        const score = scorer.calculateScore(capability, criteria);

        // Expected calculation:
        // Security: (5 - 1) / (5 - 1) * 1.0 = 1.0
        expect(score).toBeCloseTo(1.0, 2);
    })

    it("should return a score close to zero if all criteria are at their minimum bounds", () => {
        const scorer = new CapabilityCompatibilityScorer();
        const capability = {
            name: "Min Cap",
            description: "Min",
            securityLevel: 1,
            performanceScore: 0,
            cost: 0,
            compatibilityScore: 0.1
        };
        const criteria = {
            security: { weight: 0.5, min: 1, max: 5 },
            performance: { weight: 0.5, min: 0, max: 10 }
        };

        const score = scorer.calculateScore(capability, criteria);

        // Expected calculation:
        // Security: (1 - 1) / (5 - 1) * 0.5 = 0
        // Performance: (0 - 0) / (10 - 0) * 0.5 = 0
        // Total: 0
        expect(score).toBeCloseTo(0.0, 2);
    })
})