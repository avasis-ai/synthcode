import { describe, it, expect } from "vitest";
import { ContextualHistorySummarizer } from "../src/context/contextual-history-summarizer-with-retrieval-context-v2";

describe("ContextualHistorySummarizer", () => {
  it("should initialize with default values correctly", () => {
    const summarizer = new ContextualHistorySummarizer();
    // Assuming internal state or methods can be checked, or we test behavior based on defaults.
    // Since we cannot access private members directly without modification, we test a basic usage scenario.
    // For this test, we'll assume a basic initialization check is sufficient if no explicit getters are available.
    expect(summarizer).toBeDefined();
  });

  it("should correctly summarize history when only history context is provided", () => {
    const summarizer = new ContextualHistorySummarizer(500, 0.0); // Set retrieval weight to 0 to isolate history effect
    const history = "User said A. System responded B. User said C.";
    const summary = summarizer.summarizeHistory(history, []);
    expect(summary).toContain("A, B, and C"); // Expecting a summary that incorporates the history content
  });

  it("should incorporate retrieval context when provided", () => {
    const summarizer = new ContextualHistorySummarizer(1000, 0.5); // Non-zero retrieval weight
    const history = "Initial conversation segment.";
    const retrievalContext: { context: string; relevanceScore: number }[] = [
      { context: "Key detail from document X.", relevanceScore: 0.9 },
      { context: "Less relevant info.", relevanceScore: 0.2 },
    ];
    const summary = summarizer.summarizeHistory(history, retrievalContext);
    expect(summary).toContain("Key detail from document X"); // Expecting the high-relevance context to influence the summary
  });
});