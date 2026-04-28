import { describe, it, expect } from "vitest";
import { ContextualMemoryRetrievalRecencyBoost } from "../src/context/contextual-memory-retrieval-recency-boost";

describe("ContextualMemoryRetrievalRecencyBoost", () => {
  it("should calculate a positive boost for recent chunks", () => {
    const config = { decayRate: 0.1, initialBoost: 1.0 };
    const boostCalculator = new ContextualMemoryRetrievalRecencyBoost(config);
    const queryTimestamp = 1000;
    const recentChunkTimestamp = 950; // 50 units difference
    const boost = boostCalculator["calculateRecencyBoost"](recentChunkTimestamp, queryTimestamp);
    expect(boost).toBeGreaterThan(0);
  });

  it("should calculate a boost close to initialBoost for very recent chunks", () => {
    const config = { decayRate: 0.1, initialBoost: 2.0 };
    const boostCalculator = new ContextualMemoryRetrievalRecencyBoost(config);
    const queryTimestamp = 1000;
    const veryRecentChunkTimestamp = 999; // 1 unit difference
    const boost = boostCalculator["calculateRecencyBoost"](veryRecentChunkTimestamp, queryTimestamp);
    // For a difference of 1, the boost should be close to initialBoost * e^(-decayRate * 1)
    expect(boost).toBeCloseTo(2.0 * Math.exp(-0.1 * 1), 3);
  });

  it("should calculate a boost close to zero for very old chunks", () => {
    const config = { decayRate: 0.1, initialBoost: 1.0 };
    const boostCalculator = new ContextualMemoryRetrievalRecencyBoost(config);
    const queryTimestamp = 1000;
    const oldChunkTimestamp = 100; // 900 units difference
    const boost = boostCalculator["calculateRecencyBoost"](oldChunkTimestamp, queryTimestamp);
    // Expected: initialBoost * e^(-decayRate * (query - chunk))
    const expectedBoost = 1.0 * Math.exp(-0.1 * (1000 - 100));
    expect(boost).toBeCloseTo(expectedBoost, 3);
    expect(boost).toBeLessThan(0.1); // Should be significantly decayed
  });
});