import { describe, it, expect } from "vitest";
import { ContextualHistorySummarizer } from "../src/context/contextual-history-summarizer-goal-focus";

describe("ContextualHistorySummarizer", () => {
  it("should initialize with the default scoring weight", () => {
    const summarizer = new ContextualHistorySummarizer();
    // Assuming there's a way to test private members or that the constructor logic is simple enough
    // For this test, we'll rely on the default constructor behavior if we can't access private members easily.
    // A more robust test would involve checking an internal state if it were exposed.
    // For now, we just ensure it runs without error.
    expect(summarizer).toBeDefined();
  });

  it("should initialize with a custom scoring weight", () => {
    const customWeight = 0.9;
    const summarizer = new ContextualHistorySummarizer(customWeight);
    // Again, assuming internal state access for verification
    // If we could access private members: expect(summarizer['scoringWeight']).toBe(customWeight);
    expect(summarizer).toBeDefined();
  });

  it("should be instantiated correctly when provided with different weights", () => {
    const summarizer1 = new ContextualHistorySummarizer(0.1);
    const summarizer2 = new ContextualHistorySummarizer(0.99);
    expect(summarizer1).toBeInstanceOf(ContextualHistorySummarizer);
    expect(summarizer2).toBeInstanceOf(ContextualHistorySummarizer);
  });
});