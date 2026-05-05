import { describe, it, expect } from "vitest";
import {
  DependencyConstraint,
  ToolCallDependency,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v157";

describe("ToolCallDependency", () => {
  it("should correctly structure a basic tool call dependency", () => {
    const dependency: ToolCallDependency = {
      callId: "call-123",
      toolName: "search_engine",
      input: { query: "vitest testing" },
      dependencies: [
        {
          type: "temporal",
          sourceCallId: "call-001",
          targetCallId: "call-123",
          description: "Must run after initial setup.",
          details: { order: 1 },
        },
      ],
    };
    expect(dependency.callId).toBe("call-123");
    expect(dependency.toolName).toBe("search_engine");
    expect(dependency.input).toEqual({ query: "vitest testing" });
    expect(dependency.dependencies).toHaveLength(1);
  });

  it("should handle multiple types of dependencies", () => {
    const dependency: ToolCallDependency = {
      callId: "call-456",
      toolName: "database_query",
      input: { query: "user_data" },
      dependencies: [
        {
          type: "resource",
          sourceCallId: "call-002",
          targetCallId: "call-456",
          description: "Requires user context from previous call.",
          details: { resource: "user_context" },
        },
        {
          type: "capability",
          sourceCallId: "call-003",
          targetCallId: "call-456",
          description: "Needs capability check.",
          details: { required_cap: "read_user" },
        },
      ],
    };
    expect(dependency.dependencies).toHaveLength(2);
    expect(dependency.dependencies.some(d => d.type === "resource")).toBe(true);
    expect(dependency.dependencies.some(d => d.type === "capability")).toBe(true);
  });

  it("should be empty if no dependencies are specified", () => {
    const dependency: ToolCallDependency = {
      callId: "call-789",
      toolName: "simple_action",
      input: {},
      dependencies: [],
    };
    expect(dependency.dependencies).toEqual([]);
  });
});