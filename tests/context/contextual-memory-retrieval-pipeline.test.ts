import { describe, it, expect } from "vitest";
import {
  FusionScorer,
  RetrievalStrategy,
  RetrievalResult,
} from "../src/context/contextual-memory-retrieval-pipeline";

describe("FusionScorer", () => {
  it("should correctly calculate the weighted score for a single result", async () => {
    const weights: { [key: string]: number } = {
      source: 0.5,
      score: 0.3,
      context: 0.2,
    };
    const scorer = new FusionScorer(weights);

    const result: RetrievalResult = {
      source: "doc1",
      score: 0.9,
      context: "some context",
    };

    const expectedScore = (0.5 * 1) + (0.3 * 0.9) + (0.2 * 1); // Assuming source and context are treated as boolean/binary for simplicity in this test structure, though the actual implementation might use string length or similar. We'll test based on the structure.
    // Since the actual implementation details of how source/context are scored aren't fully visible, we'll test the basic structure and assume a simple additive model for the test.
    // Let's assume for this test that the scorer calculates: weight['source'] * (source is truthy) + weight['score'] * score + weight['context'] * (context is truthy)
    const calculatedScore = await scorer.calculateScore(result);

    // Based on the provided weights and result:
    // Source: "doc1" (truthy) -> weight * 1
    // Score: 0.9 -> weight * 0.9
    // Context: "some context" (truthy) -> weight * 1
    const expected = (weights.source * 1) + (weights.score * 0.9) + (weights.context * 1);

    expect(calculatedScore).toBeCloseTo(expected, 5);
  });

  it("should handle zero or negative weights correctly", async () => {
    const weights: { [key: string]: number } = {
      source: 0.0,
      score: -0.5,
      context: 0.1,
    };
    const scorer = new FusionScorer(weights);

    const result: RetrievalResult = {
      source: "doc1",
      score: 1.0,
      context: "some context",
    };

    // Expected: (0.0 * 1) + (-0.5 * 1.0) + (0.1 * 1)
    const expected = 0.0 + (-0.5) + 0.1;

    const calculatedScore = await scorer.calculateScore(result);
    expect(calculatedScore).toBeCloseTo(expected, 5);
  });

  it("should return a score of 0 if all weights are zero", async () => {
    const weights: { [key: string]: number } = {
      source: 0.0,
      score: 0.0,
      context: 0.0,
    };
    const scorer = new FusionScorer(weights);

    const result: RetrievalResult = {
      source: "doc1",
      score: 0.9,
      context: "some context",
    };

    const calculatedScore = await scorer.calculateScore(result);
    expect(calculatedScore).toBe(0);
  });
});