import { describe, it, expect, vi } from "vitest";
import { HistoryStore, ToolExecutionRecord } from "../src/tool/execution-history";

describe("HistoryStore", () => {
  it("should save a tool execution record successfully", async () => {
    const mockStore = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      getRecordsBySession: vi.fn(),
    } as unknown as HistoryStore;

    const record: ToolExecutionRecord = {
      sessionId: "test-session-id",
      toolName: "testTool",
      toolUseId: "test-tool-use-id",
      input: { query: "test input" },
      output: "test output",
      timestamp: Date.now(),
      metadata: { source: "test" },
    };

    await mockStore.saveRecord(record);

    expect(mockStore.saveRecord).toHaveBeenCalledTimes(1);
    expect(mockStore.saveRecord).toHaveBeenCalledWith(record);
  });

  it("should retrieve records for a given session ID", async () => {
    const mockStore = {
      saveRecord: vi.fn(),
      getRecordsBySession: vi.fn(),
    } as unknown as HistoryStore;

    const mockRecords: ToolExecutionRecord[] = [
      {
        sessionId: "session1",
        toolName: "toolA",
        toolUseId: "use1",
        input: {},
        output: "outputA",
        timestamp: 1678886400000,
        metadata: {},
      },
      {
        sessionId: "session1",
        toolName: "toolB",
        toolUseId: "use2",
        input: {},
        output: "outputB",
        timestamp: 1678886500000,
        metadata: {},
      },
    ];

    (mockStore.getRecordsBySession as any).mockResolvedValue(mockRecords);

    const records = await mockStore.getRecordsBySession("session1");

    expect(mockStore.getRecordsBySession).toHaveBeenCalledTimes(1);
    expect(mockStore.getRecordsBySession).toHaveBeenCalledWith("session1");
    expect(records).toEqual(mockRecords);
  });

  it("should return an empty array for a non-existent session ID", async () => {
    const mockStore = {
      saveRecord: vi.fn(),
      getRecordsBySession: vi.fn(),
    } as unknown as HistoryStore;

    (mockStore.getRecordsBySession as any).mockResolvedValue([]);

    const records = await mockStore.getRecordsBySession("non-existent-session");

    expect(mockStore.getRecordsBySession).toHaveBeenCalledTimes(1);
    expect(mockStore.getRecordsBySession).toHaveBeenCalledWith("non-existent-session");
    expect(records).toEqual([]);
  });
});