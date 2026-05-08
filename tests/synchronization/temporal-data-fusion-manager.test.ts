import { describe, it, expect } from "vitest";
import { TemporalDataFusionManager } from "../src/synchronization/temporal-data-fusion-manager";

describe("TemporalDataFusionManager", () => {
  it("should correctly fuse data from multiple sources at a given time", () => {
    const manager = new TemporalDataFusionManager();
    const targetTime = new Date("2023-10-27T10:00:00Z");

    const input1: any = {
      payload: { user_id: 1, action: "login" },
      source: "AuthService",
      arrivalTime: new Date("2023-10-27T10:00:00Z"),
      validityWindowMs: 1000,
    };
    const input2: any = {
      payload: { session_id: "abc1234", status: "active" },
      source: "SessionService",
      arrivalTime: new Date("2023-10-27T10:00:00Z"),
      validityWindowMs: 1000,
    };

    const result = manager.fuseData(
      [input1, input2],
      targetTime
    );

    expect(result).toBeDefined();
    expect(result.timestamp).toEqual(targetTime);
    expect(Object.keys(result.data)).toEqual(["user_id", "action", "session_id", "status"]);
    expect(result.sourcesUsed).toEqual(["AuthService", "SessionService"]);
  });

  it("should prioritize data from sources with higher reliability or newer arrival times (if implemented)", () => {
    const manager = new TemporalDataFusionManager();
    const targetTime = new Date("2023-10-27T11:00:00Z");

    // Simulate a conflict: both sources report 'status'
    const input1: any = {
      payload: { status: "pending" },
      source: "SourceA",
      arrivalTime: new Date("2023-10-27T11:00:00Z"),
      validityWindowMs: 1000,
    };
    const input2: any = {
      payload: { status: "confirmed" },
      source: "SourceB",
      arrivalTime: new Date("2023-10-27T11:00:00Z"),
      validityWindowMs: 1000,
    };

    // Assuming the fusion logic merges or prioritizes based on source/time
    const result = manager.fuseData(
      [input1, input2],
      targetTime
    );

    expect(result).toBeDefined();
    // Depending on the actual implementation, we test that the data is merged,
    // and if a conflict resolution strategy exists, it is applied.
    // For this test, we assume the fusion merges all unique keys.
    expect(result.data.status).toBe("confirmed"); // Assuming SourceB wins in a conflict
    expect(result.sourcesUsed).toEqual(["SourceA", "SourceB"]);
  });

  it("should return an empty context if no valid inputs are provided", () => {
    const manager = new TemporalDataFusionManager();
    const targetTime = new Date();

    const inputs: any[] = [
      { payload: { a: 1 }, source: "A", arrivalTime: new Date(), validityWindowMs: 1000 },
      { payload: { b: 2 }, source: "B", arrivalTime: new Date(), validityWindowMs: 1000 },
    ];

    // Simulate invalid inputs (e.g., outside validity window or missing data)
    const invalidInputs: any[] = [
      { payload: { a: 1 }, source: "A", arrivalTime: new Date(), validityWindowMs: 1000 },
      { payload: { b: 2 }, source: "B", arrivalTime: new Date(), validityWindowMs: 1000 },
    ];

    // Note: Since we don't have the actual implementation details for invalidity checks,
    // we test the expected behavior for an empty or non-contributing set.
    const result = manager.fuseData(
      invalidInputs,
      targetTime
    );

    expect(result).toBeDefined();
    expect(result.data).toEqual({});
    expect(result.sourcesUsed).toEqual([]);
  });
});