import { describe, it, expect } from "vitest";
import { AdvancedGraphPayload } from "../src/visualization/contextual-dependency-graph-visualizer-v159-advanced-advanced";

describe("AdvancedGraphPayload", () => {
  it("should correctly initialize with only temporal metadata", () => {
    const payload: AdvancedGraphPayload = {
      temporal: {
        startTime: 1672531200000,
        endTime: 1672531300000,
        durationMs: 10000,
      },
    };
    expect(payload.temporal).toBeDefined();
    expect(payload.resource).toBeUndefined();
  });

  it("should correctly initialize with resource and source context metadata", () => {
    const payload: AdvancedGraphPayload = {
      resource: {
        resourceName: "API_Call",
        usageAmount: 5,
        unit: "calls",
      },
      sourceContexts: {
        "user_session_1": "context_data_a",
        "system_event_2": "context_data_b",
      },
    };
    expect(payload.resource).toBeDefined();
    expect(payload.sourceContexts).toBeDefined();
    expect(payload.temporal).toBeUndefined();
  });

  it("should handle a payload with all available optional fields", () => {
    const payload: AdvancedGraphPayload = {
      temporal: {
        startTime: 1672531200000,
        endTime: 1672531300000,
        durationMs: 10000,
      },
      resource: {
        resourceName: "DatabaseQuery",
        usageAmount: 100,
        unit: "records",
      },
      sourceContexts: {
        "context_A": "valueA",
        "context_B": "valueB",
      },
    };
    expect(payload.temporal).toBeDefined();
    expect(payload.resource).toBeDefined();
    expect(payload.sourceContexts).toBeDefined();
  });
});