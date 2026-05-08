import { describe, it, expect } from "vitest";
import { CredibilityScorer } from "../src/credibility/contextual-credibility-scorer";

describe("CredibilityScorer", () => {
    it("should calculate a high score for highly credible content", async () => {
        const scorer = new CredibilityScorer();
        const message = {
            role: "user",
            content: "Based on the provided data, the conclusion is clear and supported by multiple sources.",
        };
        const score = await scorer.score(message);
        expect(score.score).toBeGreaterThan(0.8);
        expect(score.details).toContain("supported");
    });

    it("should calculate a low score for vague or unsubstantiated claims", async () => {
        const scorer = new CredibilityScorer();
        const message = {
            role: "user",
            content: "Everyone knows that the sky is green and it will rain next week.",
        };
        const score = await scorer.score(message);
        expect(score.score).toBeLessThan(0.4);
        expect(score.details).toContain("vague");
    });

    it("should handle empty or minimal input gracefully", async () => {
        const scorer = new CredibilityScorer();
        const message = {
            role: "user",
            content: "",
        };
        const score = await scorer.score(message);
        expect(score.score).toBeCloseTo(0.5, 1); // Expect a neutral or default score
        expect(score.details).toContain("minimal");
    });
});