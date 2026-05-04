import { describe, it, expect } from "vitest";
import { ContextualPayload } from "../context/contextual-state-diffing-v109";

describe("ContextualPayload", () => {
  it("should correctly structure a payload with basic state and metadata", () => {
    const initialState = {
      user: "testuser",
      messages: [],
    };
    const payload: ContextualPayload<{ user: string; messages: any[] }> = {
      state: initialState,
      metadata: {
        temporal: { timestampMs: 1678886400000, operationDurationMs: 50 },
        resources: {
          cpuUsagePercent: 10.5,
          memoryUsageBytes: 1024 * 1024 * 50,
          networkLatencyMs: 150,
        },
      },
    };

    expect(payload.state).toEqual(initialState);
    expect(payload.metadata).toBeDefined();
    expect(payload.metadata?.temporal).toEqual({
      timestampMs: 1678886400000,
      operationDurationMs: 50,
    });
    expect(payload.metadata?.resources).toEqual({
      cpuUsagePercent: 10.5,
      memoryUsageBytes: 1024 * 1024 * 50,
      networkLatencyMs: 150,
    });
  });

  it("should handle zero values in resource metrics", () => {
    const initialState = {
      data: "some data",
    };
    const payload: ContextualPayload<{ data: string }> = {
      state: initialState,
      metadata: {
        temporal: { timestampMs: 0, operationDurationMs: 0 },
        resources: {
          cpuUsagePercent: 0,
          memoryUsageBytes: 0,
          networkLatencyMs: 0,
        },
      },
    };

    expect(payload.metadata?.resources).toEqual({
      cpuUsagePercent: 0,
      memoryUsageBytes: 0,
      networkLatencyMs: 0,
    });
    expect(payload.metadata?.temporal).toEqual({
      timestampMs: 0,
      operationDurationMs: 0,
    });
  });

  it("should correctly type-check the generic state T", () => {
    type TestState = { count: number; active: boolean };
    const payload: ContextualPayload<TestState> = {
      state: { count: 10, active: true },
      metadata: {
        temporal: { timestampMs: 123, operationDurationMs: 10 },
        resources: {
          cpuUsagePercent: 5,
          memoryUsageBytes: 200,
          networkLatencyMs: 50,
        },
      },
    };

    expect(payload.state).toEqual({ count: 10, active: true });
    // This test primarily verifies structural integrity based on the generic type T
    expect(typeof payload.state.count).toBe("number");
    expect(typeof payload.state.active).toBe("boolean");
  });
});