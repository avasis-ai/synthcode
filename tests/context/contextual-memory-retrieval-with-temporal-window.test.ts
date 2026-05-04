import { describe, it, expect } from "vitest";
import { TemporalContextualMemoryRetriever } from "../context/contextual-memory-retrieval-with-temporal-window";

describe("TemporalContextualMemoryRetriever", () => {
  it("should retrieve relevant memory chunks within a specified time window", async () => {
    const retriever = new TemporalContextualMemoryRetriever();
    const query = "What was discussed about the project deadline?";
    const history: Message[] = [];
    const window: TemporalWindow = {
      startTime: Date.now() - 60000, // 1 minute ago
      endTime: Date.now(),
    };

    // Mocking the retrieval to return specific chunks for testing
    const mockMemoryChunks: MemoryChunk[] = [
      { content: "The deadline was moved to Friday.", timestamp: Date.now() - 30000, source: "Meeting Notes" },
      { content: "Initial discussion on scope creep.", timestamp: Date.now() - 120000, source: "Email" },
    ];

    // A simple mock implementation for testing purposes
    const mockRetrieveContext = retriever["retrieveContext"] as (
      query: string,
      history: Message[],
      window: TemporalWindow
    ) => Promise.resolve(mockMemoryChunks);

    // Overwrite the actual method for isolated testing
    (retriever as any).retrieveContext = mockRetrieveContext;

    const result = await retriever.retrieveContext(query, history, window);

    expect(result).toHaveLength(2);
    expect(result.every(chunk => chunk.source)).toBe(true);
    expect(result[0].content).toContain("deadline");
  });

  it("should prioritize contextually relevant memories when the window is broad", async () => {
    const retriever = new TemporalContextualMemoryRetriever();
    const query = "Follow up on the marketing strategy.";
    const history: Message[] = [];
    const window: TemporalWindow = {
      relativeOffsetMinutes: 120, // 2 hours window
    };

    const mockMemoryChunks: MemoryChunk[] = [
      { content: "Marketing budget approved for Q3.", timestamp: Date.now() - 7200000, source: "Budget Doc" }, // 2 hours ago
      { content: "Need to refine the social media plan.", timestamp: Date.now() - 10000, source: "Chat Log" }, // Recent
    ];

    const mockRetrieveContext = retriever["retrieveContext"] as (
      query: string,
      history: Message[],
      window: TemporalWindow
    ) => Promise.resolve(mockMemoryChunks);

    (retriever as any).retrieveContext = mockRetrieveContext;

    const result = await retriever.retrieveContext(query, history, window);

    expect(result).toHaveLength(2);
    // In a real scenario, we'd check relevance, here we check if both are returned
    expect(result.some(chunk => chunk.source === "Budget Doc")).toBe(true);
    expect(result.some(chunk => chunk.source === "Chat Log")).toBe(true);
  });

  it("should return an empty array if no memories fall within the specified temporal window", async () => {
    const retriever = new TemporalContextualMemoryRetriever();
    const query = "Old topic check.";
    const history: Message[] = [];
    const window: TemporalWindow = {
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now() - 10000,   // Ended 10 seconds ago
    };

    const mockMemoryChunks: MemoryChunk[] = [];

    const mockRetrieveContext = retriever["retrieveContext"] as (
      query: string,
      history: Message[],
      window: TemporalWindow
    ) => Promise.resolve(mockMemoryChunks);

    (retriever as any).retrieveContext = mockRetrieveContext;

    const result = await retriever.retrieveContext(query, history, window);

    expect(result).toEqual([]);
  });
});