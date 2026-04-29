import { describe, it, expect } from "vitest";
import { ContextualMemoryRetrieverV3, DecayRule, MemoryChunk } from "../src/context/contextual-memory-retrieval-with-recency-decay-v3";

describe("ContextualMemoryRetrieverV3", () => {
  it("should initialize correctly with a decay rule", () => {
    const decayRule: DecayRule = {
      baseDecayFactor: 0.1,
      timeWeightMultiplier: 0.5,
    };
    const retriever = new ContextualMemoryRetrieverV3(decayRule);
    // We can't directly test private members, but we can test its usage flow
    // For this test, we'll assume the constructor sets up the state correctly.
    expect(retriever).toBeInstanceOf(ContextualMemoryRetrieverV3);
  });

  it("should calculate a decay boost that decreases with time difference", () => {
    const decayRule: DecayRule = {
      baseDecayFactor: 0.2,
      timeWeightMultiplier: 0.1,
    };
    const retriever = new ContextualMemoryRetrieverV3(decayRule);

    const now = Date.now();
    const recentTimestamp = now - 1000; // 1 second ago
    const oldTimestamp = now - 100000; // 100 seconds ago

    const chunkRecent: MemoryChunk = {
      id: "recent",
      content: "Recent info",
      timestamp: recentTimestamp,
      metadata: {},
    };
    const chunkOld: MemoryChunk = {
      id: "old",
      content: "Old info",
      timestamp: oldTimestamp,
      metadata: {},
    };

    // Mocking the internal calculation to check the decay logic's effect
    // Since calculateDecayBoost is private, we test the public method that uses it.
    // Assuming the public method uses the decay boost to influence retrieval score.
    // We'll check if the score for the recent item is higher than the old item.
    const scoreRecent = retriever.calculateScore(chunkRecent);
    const scoreOld = retriever.calculateScore(chunkOld);

    expect(scoreRecent).toBeGreaterThan(scoreOld);
  });

  it("should prioritize chunks with matching context metadata", () => {
    const decayRule: DecayRule = {
      baseDecayFactor: 0.1,
      timeWeightMultiplier: 0.5,
    };
    const retriever = new ContextualMemoryRetrieverV3(decayRule);

    const now = Date.now();
    const chunkContextMatch: MemoryChunk = {
      id: "match",
      content: "Context match",
      timestamp: now - 5000,
      metadata: { topic: "AI", source: "user" },
    };
    const chunkNoMatch: MemoryChunk = {
      id: "nomatch",
      content: "No context match",
      timestamp: now - 5000,
      metadata: { topic: "weather", source: "system" },
    };

    // The retrieval score should be significantly higher for the matching context
    const scoreMatch = retriever.calculateScore(chunkContextMatch);
    const scoreNoMatch = retriever.calculateScore(chunkNoMatch);

    expect(scoreMatch).toBeGreaterThan(scoreNoMatch * 1.5); // Expect a substantial boost for context match
  });
});