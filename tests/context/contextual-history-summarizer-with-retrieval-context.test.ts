import { describe, it, expect, vi } from "vitest";
import { ContextualHistorySummarizerWithRetrievalContext } from "../src/context/contextual-history-summarizer-with-retrieval-context";
import { Message, ContextChunk } from "../src/context/types";

describe("ContextualHistorySummarizerWithRetrievalContext", () => {
  it("should summarize history correctly when no retrieval context is provided", async () => {
    const mockLlmService = {
      generateContent: vi.fn().mockResolvedValue("Summary based only on history."),
    };
    const summarizer = new ContextualHistorySummarizerWithRetrievalContext(mockLlmService);

    const history: Message[] = [
      { role: "user", content: "Hi, what is the capital of France?" },
      { role: "assistant", content: "The capital of France is Paris." },
      { role: "user", content: "And what is its population?" },
    ];

    const summary = await summarizer.summarizeHistoryWithRetrievalContext(history, undefined);

    expect(mockLlmService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining("Summarize the following conversation history:")
    );
    expect(summary).toBe("Summary based only on history.");
  });

  it("should incorporate retrieval context when provided", async () => {
    const mockLlmService = {
      generateContent: vi.fn().mockResolvedValue("Summary incorporating context."),
    };
    const summarizer = new ContextualHistorySummarizerWithRetrievalContext(mockLlmService);

    const history: Message[] = [
      { role: "user", content: "Tell me about quantum computing." },
    ];
    const context: ContextChunk[] = [
      { text: "Quantum computing uses qubits.", source: "Doc A" },
      { text: "Superposition is a key concept.", source: "Doc B" },
    ];

    const summary = await summarizer.summarizeHistoryWithRetrievalContext(history, context);

    expect(mockLlmService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining("Conversation History:")
    );
    expect(mockLlmService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining("Context:")
    );
    expect(summary).toBe("Summary incorporating context.");
  });

  it("should handle empty history and context gracefully", async () => {
    const mockLlmService = {
      generateContent: vi.fn().mockResolvedValue("No significant interaction detected."),
    };
    const summarizer = new ContextualHistorySummarizerWithRetrievalContext(mockLlmService);

    const history: Message[] = [];
    const context: ContextChunk[] = [];

    const summary = await summarizer.summarizeHistoryWithRetrievalContext(history, context);

    expect(mockLlmService.generateContent).toHaveBeenCalledTimes(1);
    expect(summary).toBe("No significant interaction detected.");
  });
});