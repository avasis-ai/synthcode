import { describe, it, expect, vi } from "vitest";
import { StatefulHistoryStore } from "../src/history/stateful-tool-history";

describe("StatefulHistoryStore", () => {
  it("should initialize with the provided store", async () => {
    const mockStore = {
      saveRecord: vi.fn(),
      getRecordsForContext: vi.fn(),
    } as any;
    const historyStore = new StatefulHistoryStore(mockStore);
    expect(historyStore).toBeInstanceOf(StatefulHistoryStore);
  });

  it("should save a record using the underlying store", async () => {
    const mockStore = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      getRecordsForContext: vi.fn(),
    } as any;
    const historyStore = new StatefulHistoryStore(mockStore);

    const contextId = "test-context";
    const record = {
      toolName: "testTool",
      input: { query: "test" },
      output: "test output",
      executionMetadata: { durationMs: 100, success: true },
      contextId: contextId,
    };

    await historyStore.saveRecord(contextId, record);

    expect(mockStore.saveRecord).toHaveBeenCalledWith(contextId, record);
  });

  it("should retrieve records for a context using the underlying store", async () => {
    const mockStore = {
      saveRecord: vi.fn(),
      getRecordsForContext: vi.fn().mockResolvedValue([
        {
          toolName: "toolA",
          input: {},
          output: "outputA",
          executionMetadata: { durationMs: 50, success: true },
          contextId: "context1",
        },
        {
          toolName: "toolB",
          input: {},
          output: "outputB",
          executionMetadata: { durationMs: 150, success: false },
          contextId: "context1",
        },
      ]),
    } as any;
    const historyStore = new StatefulHistoryStore(mockStore);

    const contextId = "context1";
    const records = await historyStore.getRecordsForContext(contextId);

    expect(mockStore.getRecordsForContext).toHaveBeenCalledWith(contextId);
    expect(records).toHaveLength(2);
    expect(records[0].toolName).toBe("toolA");
  });
});