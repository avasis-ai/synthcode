import { describe, it, expect } from "vitest";
import { ContextualMemoryRetriever } from "../src/context/contextual-memory-retrieval-with-source-attribution-v5";

describe("ContextualMemoryRetriever", () => {
  it("should retrieve context based on query and history when context is available", async () => {
    const retriever = new ContextualMemoryRetriever();
    const query = "What is the main topic discussed?";
    const history: Message[] = [
      { role: "user", content: "Tell me about quantum computing." },
      { role: "assistant", content: "Quantum computing uses principles of quantum mechanics..." },
    ];
    const k = 2;

    // Mocking the retrieval mechanism for testing purposes
    // In a real scenario, this would involve actual database/vector store calls.
    // We assume the implementation handles this internally or via dependency injection.
    // For this test, we check the structure and basic execution path.
    const context = await retriever.retrieveContext(query, history, k);

    expect(context).toBeDefined();
    expect(Array.isArray(context)).toBe(true);
    expect(context.length).toBeGreaterThanOrEqual(1);
    context.forEach(entry => {
      expect(entry).toHaveProperty("content");
      expect(entry).toHaveProperty("source");
      expect(entry).toHaveProperty("metadata");
    });
  });

  it("should return an empty array if no relevant context is found", async () => {
    const retriever = new ContextualMemoryRetriever();
    const query = "What is the capital of Mars?"; // Unlikely topic in history
    const history: Message[] = [
      { role: "user", content: "Discussing astrophysics." },
      { role: "assistant", content: "Stars are massive balls of plasma..." },
    ];
    const k = 3;

    const context = await retriever.retrieveContext(query, history, k);

    expect(context).toEqual([]);
  });

  it("should respect the requested number of context items (k)", async () => {
    const retriever = new ContextualMemoryRetriever();
    const query = "Summarize the key points.";
    const history: Message[] = [
      { role: "user", content: "Point 1: Energy efficiency." },
      { role: "assistant", content: "Point 2: Quantum entanglement." },
      { role: "user", content: "Point 3: Future scalability." },
    ];
    const k = 2;

    const context = await retriever.retrieveContext(query, history, k);

    // We expect at most k items, and ideally exactly k if enough context exists.
    expect(context.length).toBeLessThanOrEqual(k);
    if (context.length > 0) {
      // Basic check to ensure the retrieved items are distinct enough to suggest k was respected
      const uniqueContents = new Set(context.map(c => c.content));
      expect(uniqueContents.size).toBe(context.length);
    }
  });
});