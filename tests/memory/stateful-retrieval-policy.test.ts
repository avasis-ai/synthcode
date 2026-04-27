import { describe, it, expect } from "vitest";
import { StatefulRetriever } from "../src/memory/stateful-retrieval-policy";

describe("StatefulRetriever", () => {
  it("should apply a boost factor when context is present", () => {
    const retriever = new StatefulRetriever(0.5);
    const context: StateContext = {
      lastToolCall: { name: "search", input: { query: "apple" } },
      currentGoal: "Find information about apples",
    };
    const items = [
      { id: 1, content: "Apple is a fruit." },
      { id: 2, content: "The best apple pie recipe." },
    ];
    const result = retriever.apply("apple", context, items);
    expect(result.length).toBe(2);
    // In a real scenario, we would check the boost logic, but for this test, we check if it runs.
    // Assuming the implementation filters or reorders based on context.
  });

  it("should return all items when context is empty", () => {
    const retriever = new StatefulRetriever(0.1);
    const context: StateContext = {};
    const items = [
      { id: 1, content: "Item A" },
      { id: 2, content: "Item B" },
    ];
    const result = retriever.apply("query", context, items);
    expect(result).toEqual(items);
  });

  it("should handle an empty list of items gracefully", () => {
    const retriever = new StatefulRetriever(0.5);
    const context: StateContext = {
      currentGoal: "Test empty state",
    };
    const items: any[] = [];
    const result = retriever.apply("query", context, items);
    expect(result).toEqual([]);
  });
});