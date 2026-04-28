import { describe, it, expect, vi } from "vitest";
import { StatefulToolInvocationHistoryManager } from "../src/history/stateful-tool-invocation-history-manager";
import { InvocationRecord } from "../src/history/types";

describe("StatefulToolInvocationHistoryManager", () => {
  it("should correctly save and retrieve a single invocation record", async () => {
    const mockStore = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      getRecordsByContext: vi.fn().mockResolvedValue([]),
      getRecordsSince: vi.fn().mockResolvedValue([]),
      getAllRecords: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new StatefulToolInvocationHistoryManager(mockStore);

    const record: InvocationRecord = {
      timestamp: Date.now(),
      contextId: "context1",
      toolName: "testTool",
      input: { query: "test" },
      success: true,
      durationMs: 100,
    };

    await manager.recordInvocation(record);

    expect(mockStore.saveRecord).toHaveBeenCalledTimes(1);
    expect(mockStore.saveRecord).toHaveBeenCalledWith(record);
  });

  it("should handle multiple invocations for the same context", async () => {
    const mockStore = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      getRecordsByContext: vi.fn().mockResolvedValue([]),
      getRecordsSince: vi.fn().mockResolvedValue([]),
      getAllRecords: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new StatefulToolInvocationHistoryManager(mockStore);

    const record1: InvocationRecord = {
      timestamp: 1000,
      contextId: "contextA",
      toolName: "tool1",
      input: {},
      success: true,
      durationMs: 50,
    };
    const record2: InvocationRecord = {
      timestamp: 2000,
      contextId: "contextA",
      toolName: "tool2",
      input: {},
      success: false,
      durationMs: 150,
      errorMessage: "Error",
    };

    await manager.recordInvocation(record1);
    await manager.recordInvocation(record2);

    expect(mockStore.saveRecord).toHaveBeenCalledTimes(2);
    // Check if both records were passed to saveRecord in order
    const calls = mockStore.saveRecord.mock.calls.map(call => call[0]);
    expect(calls[0]).toEqual(record1);
    expect(calls[1]).toEqual(record2);
  });

  it("should correctly retrieve and manage records using contextId", async () => {
    const mockStore = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      getRecordsByContext: vi.fn().mockResolvedValue([{ contextId: "contextA", toolName: "tool1", timestamp: 1000, success: true, durationMs: 50 }]),
      getRecordsSince: vi.fn().mockResolvedValue([]),
      getAllRecords: vi.fn().mockResolvedValue([]),
    } as any;

    const manager = new StatefulToolInvocationHistoryManager(mockStore);

    const contextId = "contextA";
    await manager.getHistoryByContext(contextId);

    expect(mockStore.getRecordsByContext).toHaveBeenCalledWith(contextId);
  });
});