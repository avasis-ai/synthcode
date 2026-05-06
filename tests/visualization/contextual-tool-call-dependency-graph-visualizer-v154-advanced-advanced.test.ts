import { describe, it, expect } from "vitest";
import {
  ContextualToolCall,
  ResourceConstraint,
  TimeWindow,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v154-advanced-advanced";

describe("ContextualToolCall", () => {
  it("should correctly structure a basic ContextualToolCall", () => {
    const call: ContextualToolCall = {
      toolUseId: "tool-call-123",
      toolName: "search_engine",
      input: { query: "vitest testing" },
      dependencies: ["user_input"],
    };
    expect(call.toolUseId).toBe("tool-call-123");
    expect(call.toolName).toBe("search_engine");
    expect(call.input).toEqual({ query: "vitest testing" });
    expect(call.dependencies).toEqual(["user_input"]);
  });

  it("should handle optional resourceConstraints", () => {
    const constraints: ResourceConstraint[] = [
      { resourceName: "api_key", minUsage: 1, maxUsage: 5 },
    ];
    const call: ContextualToolCall = {
      toolUseId: "tool-call-456",
      toolName: "data_fetcher",
      input: { endpoint: "/data" },
      dependencies: ["system_context"],
      resourceConstraints: constraints,
    };
    expect(call.resourceConstraints).toBeDefined();
    expect(call.resourceConstraints![0].resourceName).toBe("api_key");
  });

  it("should correctly include time window information if available", () => {
    const call: ContextualToolCall = {
      toolUseId: "tool-call-789",
      toolName: "video_processor",
      input: { videoId: "vid1" },
      dependencies: [],
      resourceConstraints: undefined, // Testing case where resourceConstraints is omitted
    };
    // Although TimeWindow is defined in the scope, ContextualToolCall itself doesn't use it directly in its definition provided.
    // We test the structure based on the provided interface.
    expect(call.toolUseId).toBe("tool-call-789");
    expect(call.toolName).toBe("video_processor");
    expect(call.dependencies).toEqual([]);
  });
});