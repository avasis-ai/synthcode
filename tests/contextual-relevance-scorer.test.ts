import { describe, it, expect } from "vitest";
import { EmbeddingScorer } from "../src/context/contextual-relevance-scorer";
import { Message } from "../src/context/types";

describe("EmbeddingScorer", () => {
  const scorer = new EmbeddingScorer();

  it("should return 0.0 if the target query is empty", () => {
    const mockMessage: Message = {
      id: "1",
      content: [
        { type: "text", text: "Some relevant text." }
      ]
    };
    const score = scorer.score(mockMessage, "");
    expect(score).toBe(0.0);
  });

  it("should return 0.0 if the chunk content is empty", () => {
    const mockMessage: Message = {
      id: "2",
      content: []
    };
    const score = scorer.score(mockMessage, "What is the context?");
    expect(score).toBe(0.0);
  });

  it("should calculate a positive score for relevant content", () => {
    // Note: Since the actual scoring logic is mocked/incomplete, we test the path flow
    // and assume a non-zero score for valid inputs.
    const mockMessage: Message = {
      id: "3",
      content: [
        { type: "text", text: "The quick brown fox jumps over the lazy dog." }
      ]
    };
    const score = scorer.score(mockMessage, "Tell me about foxes.");
    expect(score).toBeGreaterThan(0.0);
  });
});