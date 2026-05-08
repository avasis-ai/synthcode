import { describe, it, expect } from "vitest";
import { SourceCredibilityEngine, SourceMetadata } from "../src/credibility/source-credibility-engine";

describe("SourceCredibilityEngine", () => {
  it("should calculate an initial score correctly based on base trust and consistency", () => {
    const metadata: SourceMetadata = {
      sourceId: "testSource",
      baseTrustScore: 0.8,
      lastSeenTimestamp: Date.now(),
      historicalConflictRate: 0.1,
      consistencyScore: 0.9,
    };
    const engine = new SourceCredibilityEngine(0.0, 0.0, 1.0); // Disable decay/penalty for simple test
    const score = engine.calculateScore(metadata);
    // Expected score calculation (simplified for this test):
    // BaseTrust * (1 - ConflictRate) + Consistency * Weight
    // 0.8 * (1 - 0.1) + 0.9 * 1.0 = 0.72 + 0.9 = 1.62 (Note: Actual implementation might normalize this)
    // Assuming the calculation is designed to combine these factors:
    expect(score).toBeCloseTo(0.8 * (1 - 0.1) + 0.9 * 1.0, 5);
  });

  it("should penalize the score significantly when conflict rate is high", () => {
    const metadata: SourceMetadata = {
      sourceId: "conflictSource",
      baseTrustScore: 1.0,
      lastSeenTimestamp: Date.now(),
      historicalConflictRate: 0.5,
      consistencyScore: 1.0,
    };
    // Use default factors to ensure penalty is applied
    const engine = new SourceCredibilityEngine();
    const score = engine.calculateScore(metadata);
    // The score should be noticeably lower than if the conflict rate was 0.
    const perfectScore = 1.0 * (1 - 0.0) + 1.0 * 1.0; // Simplified baseline
    expect(score).toBeLessThan(perfectScore * 0.9);
  });

  it("should decay the score when the source is old (low recency)", () => {
    const metadata: SourceMetadata = {
      sourceId: "oldSource",
      baseTrustScore: 1.0,
      lastSeenTimestamp: Date.now() - 1000000, // 1 million seconds ago
      historicalConflictRate: 0.0,
      consistencyScore: 1.0,
    };
    // Use a visible decay factor
    const decayFactor = 0.0001;
    const engine = new SourceCredibilityEngine(decayFactor, 0.0, 0.0);
    const score = engine.calculateScore(metadata);

    // The score should be reduced due to the time elapsed
    const expectedDecay = 1.0 - (Date.now() - metadata.lastSeenTimestamp) * decayFactor;
    expect(score).toBeCloseTo(expectedDecay, 5);
  });
});