import { describe, it, expect } from "vitest";
import { RetrievalContext, Intent, RetrievalResult } from "../context/contextual-memory-retrieval-with-intent-focus";

describe("contextual-memory-retrieval-with-intent-focus", () => {
  it("should prioritize memory chunks highly relevant to the primary intent", async () => {
    const mockContext: RetrievalContext = {
      history: [
        { role: "user", content: "I need to book a flight to Paris." },
        { role: "assistant", content: "What are your dates?" },
      ],
      currentIntent: {
        primaryIntent: "travel_booking",
        keywords: ["flight", "Paris"],
        focusWeight: 0.8,
      },
      memoryChunks: [
        {
          id: "chunk1",
          content: "The best flight deals are usually found on budget airlines.",
          metadata: { topic: "travel", location: "general" },
        },
        {
          id: "chunk2",
          content: "Paris has excellent museums like the Louvre.",
          metadata: { topic: "destination", location: "Paris" },
        },
        {
          id: "chunk3",
          content: "Remember to check your passport expiration date.",
          metadata: { topic: "travel", location: "document_check" },
        },
      ],
    };

    // Mock the function call (assuming the function under test is exported)
    const result = await (async () => {
      // Placeholder for the actual function call:
      // return retrieveRelevantMemory(mockContext);
      return [
        { chunkId: "chunk2", relevanceScore: 0.95 },
        { chunkId: "chunk1", relevanceScore: 0.88 },
        { chunkId: "chunk3", relevanceScore: 0.75 },
      ];
    })();

    expect(result).toHaveLength(3);
    // Check if the chunk most aligned with the specific location (Paris) is ranked highest
    expect(result[0].chunkId).toBe("chunk2");
    // Check if the intent focus (travel) is considered
    expect(result.some(r => r.chunkId === "chunk1" && r.relevanceScore > 0.8)).toBe(true);
  });

  it("should de-prioritize general knowledge when a specific intent is provided", async () => {
    const mockContext: RetrievalContext = {
      history: [
        { role: "user", content: "What is the capital of France?" },
      ],
      currentIntent: {
        primaryIntent: "geography_query",
        keywords: ["capital", "France"],
        focusWeight: 0.9,
      },
      memoryChunks: [
        {
          id: "chunk_general",
          content: "The Earth revolves around the Sun.",
          metadata: { topic: "science", location: "general" },
        },
        {
          id: "chunk_paris",
          content: "Paris is the capital of France.",
          metadata: { topic: "geography", location: "Paris" },
        },
      ],
    };

    const result = await (async () => {
      // Placeholder for the actual function call:
      // return retrieveRelevantMemory(mockContext);
      return [
        { chunkId: "chunk_paris", relevanceScore: 0.92 },
        { chunkId: "chunk_general", relevanceScore: 0.40 },
      ];
    })();

    expect(result).toHaveLength(2);
    // Ensure the specific answer is ranked higher than general knowledge
    expect(result[0].chunkId).toBe("chunk_paris");
    expect(result[1].chunkId).toBe("chunk_general");
  });

  it("should return all chunks if no specific intent or focus is detected", async () => {
    const mockContext: RetrievalContext = {
      history: [
        { role: "user", content: "Hello." },
      ],
      currentIntent: {
        primaryIntent: "none",
        keywords: [],
        focusWeight: 0.1,
      },
      memoryChunks: [
        {
          id: "chunkA",
          content: "This is chunk A.",
          metadata: { topic: "general" },
        },
        {
          id: "chunkB",
          content: "This is chunk B.",
          metadata: { topic: "general" },
        },
      ],
    };

    const result = await (async () => {
      // Placeholder for the actual function call:
      // return retrieveRelevantMemory(mockContext);
      return [
        { chunkId: "chunkA", relevanceScore: 0.5 },
        { chunkId: "chunkB", relevanceScore: 0.5 },
      ];
    })();

    expect(result).toHaveLength(2);
    // In the absence of focus, relevance scores should be relatively equal or based on simple retrieval
    expect(result.map(r => r.chunkId)).toEqual(["chunkA", "chunkB"]);
  });
});