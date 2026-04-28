import { describe, it, expect } from "vitest";
import {
  AdvancedNodePayload,
  GraphData,
  VisualizationOptions,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v139-advanced";

describe("AdvancedNodePayload", () => {
  it("should correctly structure a basic node payload", () => {
    const payload: AdvancedNodePayload = {
      id: "node-1",
      type: "tool_use",
      payload: {
        toolName: "search",
        parameters: { query: "test" },
      },
      metadata: {
        source: "user",
        timestamp: Date.now(),
      },
    };
    expect(payload.id).toBe("node-1");
    expect(payload.type).toBe("tool_use");
    expect(payload.payload).toEqual({
      toolName: "search",
      parameters: { query: "test" },
    });
  });

  it("should handle a node with thinking process metadata", () => {
    const payload: AdvancedNodePayload = {
      id: "node-thinking-2",
      type: "thinking",
      payload: {
        thought: "I need to check the user's intent first.",
      },
      metadata: {
        source: "assistant",
        timestamp: Date.now(),
      },
    };
    expect(payload.type).toBe("thinking");
    expect(payload.payload).toHaveProperty("thought");
  });

  it("should correctly process a node with multiple constraints", () => {
    const payload: AdvancedNodePayload = {
      id: "node-constrained-3",
      type: "tool_result",
      payload: {
        result: "Success",
      },
      metadata: {
        source: "system",
        timestamp: Date.now(),
      },
      constraints: {
        resource: [
          { resourceName: "api_key", minAmount: 1, maxAmount: 1 },
        ],
        temporal: [
          { startTimeMs: 1672531200000, endTimeMs: 1672531260000 },
        ],
        capability: [
          { sourceCapability: "A", targetCapability: "B", required: true },
        ],
      },
    };
    expect(payload.constraints).toBeDefined();
    expect(payload.constraints?.resource).toHaveLength(1);
    expect(payload.constraints?.temporal).toHaveLength(1);
  });
});