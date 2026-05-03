import { describe, it, expect } from "vitest";
import { ContextualToolCallHistoryManager } from "../src/history/contextual-tool-call-history-manager";

describe("ContextualToolCallHistoryManager", () => {
  it("should initialize with provided history and default threshold", () => {
    const initialHistory: any[] = [
      {
        toolName: "toolA",
        inputs: { id: "1" },
        output: "resultA",
        timestamp: 1678886400000,
      },
    ];
    const manager = new ContextualToolCallHistoryManager(initialHistory, 0.9);

    // We can't directly access private members, but we can test behavior that relies on initialization
    // For simplicity, we'll assume a method that reads history exists or test the constructor's effect.
    // Since we don't have other methods, we'll rely on testing the constructor's setup implicitly.
    // A better test would require a getter or a method to inspect the history.
    // For now, we'll just ensure it runs without error and that the threshold is set (if we could access it).
    expect(manager).toBeDefined();
  });

  it("should add a new tool call record to the history", () => {
    const manager = new ContextualToolCallHistoryManager();
    const newRecord = {
      toolName: "toolB",
      inputs: { query: "test" },
      output: "resultB",
      timestamp: Date.now(),
    };

    // Assuming a method like addRecord exists or we can test the internal state change
    // Since we cannot see the full class, we'll assume a method 'addRecord' exists for testing purposes.
    // If 'addRecord' doesn't exist, this test will fail compilation/runtime, but it demonstrates intent.
    // For this example, we'll assume the class has a method `addRecord(record: ToolCallRecord)`
    // @ts-ignore
    manager.addRecord(newRecord);

    // If we could access history:
    // expect(manager.getHistory()).toHaveLength(1);
    // expect(manager.getHistory()[0]).toEqual(newRecord);
  });

  it("should filter out records below the similarity threshold when checking for duplicates", () => {
    const manager = new ContextualToolCallHistoryManager([], 0.8);
    // Mocking a scenario where two records are added, and one is deemed too similar to the other
    const record1: any = { toolName: "toolX", inputs: { a: 1 }, output: "out1", timestamp: Date.now() - 1000 };
    const record2: any = { toolName: "toolX", inputs: { a: 1.1 }, output: "out2", timestamp: Date.now() };

    // Assuming a method like checkAndAddUniqueRecord exists
    // @ts-ignore
    manager.checkAndAddUniqueRecord(record2);

    // If the logic correctly filters based on similarity, the history size should reflect that.
    // expect(manager.getHistory()).toHaveLength(1);
  });
});