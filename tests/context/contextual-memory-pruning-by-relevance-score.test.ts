import { describe, it, expect } from "vitest";
import { ContextualMemoryPruningByRelevanceScore } from "../src/context/contextual-memory-pruning-by-relevance-score";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("ContextualMemoryPruningByRelevanceScore", () => {
  it("should prune memories based on relevance score and top K limit", () => {
    const mockScorer: any = {
      score: (query: string, chunk: string) => {
        if (chunk.includes("important")) return 0.9;
        if (chunk.includes("low")) return 0.2;
        return 0.05;
      },
    };

    const memories: ContentBlock[] = [
      { type: "text", content: "This is an unimportant piece of text." },
      { type: "text", content: "This chunk is very important for the query." },
      { type: "text", content: "Another low relevance chunk." },
      { type: "text", content: "A moderately relevant piece." },
      { type: "text", content: "The most important piece." },
      { type: "text", content: "Yet another low relevance chunk." },
    ];

    const pruningService = new ContextualMemoryPruningByRelevanceScore(mockScorer, 3, 0.15);
    const prunedMemories = pruningService.prune(memories, "query");

    expect(prunedMemories).toHaveLength(3);
    expect(prunedMemories.every(block => block.type === "text")).toBe(true);
    // Check if the top 3 highest scoring items are kept (0.9, 0.9, 0.05 or similar based on implementation details)
    // Given the mock scorer, the top 3 should be the two 'important' ones and the 'moderately relevant' one if the threshold allows.
    // Since we set topK=3 and threshold=0.15, we expect the top 3 scores (0.9, 0.9, 0.2) to pass.
    const scores = prunedMemories.map(block => mockScorer.score("query", block.content));
    expect(scores).toEqual([0.9, 0.9, 0.2]);
  });

  it("should prune all memories if the threshold is too high", () => {
    const mockScorer: any = {
      score: (query: string, chunk: string) => 0.5,
    };

    const memories: ContentBlock[] = [
      { type: "text", content: "Relevant chunk 1" },
      { type: "text", content: "Relevant chunk 2" },
    ];

    const pruningService = new ContextualMemoryPruningByRelevanceScore(mockScorer, 5, 0.6);
    const prunedMemories = pruningService.prune(memories, "query");

    expect(prunedMemories).toHaveLength(0);
  });

  it("should respect the top K limit even if more than K memories pass the threshold", () => {
    const mockScorer: any = {
      score: (query: string, chunk: string) => 0.5, // All score equally high
    };

    const memories: ContentBlock[] = [
      { type: "text", content: "M1" },
      { type: "text", content: "M2" },
      { type: "text", content: "M3" },
      { type: "text", content: "M4" },
    ];

    // Set topK=2, threshold=0.1 (all pass)
    const pruningService = new ContextualMemoryPruningByRelevanceScore(mockScorer, 2, 0.1);
    const prunedMemories = pruningService.prune(memories, "query");

    expect(prunedMemories).toHaveLength(2);
  });
});