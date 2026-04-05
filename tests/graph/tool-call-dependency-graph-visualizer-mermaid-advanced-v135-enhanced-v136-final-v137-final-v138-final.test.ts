import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphMetadata,
  DependencyEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced-v136-final-v137-final-v138-final";

describe("ToolCallDependencyGraphMetadata and DependencyEdge", () => {
  it("should correctly structure ToolCallDependencyGraphMetadata", () => {
    const metadata: ToolCallDependencyGraphMetadata = {
      tool_call_id: "call_123",
      tool_name: "search_tool",
      input_params: { query: "test search" },
      preconditions: ["user_has_internet"],
      success_path: "success_flow",
      error_path: "error_flow",
      description: "A search operation.",
    };
    expect(metadata.tool_call_id).toBe("call_123");
    expect(metadata.tool_name).toBe("search_tool");
    expect(metadata.input_params).toEqual({ query: "test search" });
    expect(metadata.preconditions).toEqual(["user_has_internet"]);
    expect(metadata.success_path).toBe("success_flow");
    expect(metadata.error_path).toBe("error_flow");
    expect(metadata.description).toBe("A search operation.");
  });

  it("should correctly structure DependencyEdge", () => {
    const edge: DependencyEdge = {
      source_id: "node_A",
      target_id: "node_B",
      relationship: "calls",
    };
    expect(edge.source_id).toBe("node_A");
    expect(edge.target_id).toBe("node_B");
    expect(edge.relationship).toBe("calls");
  });

  it("should handle different relationship types in DependencyEdge", () => {
    const edge: DependencyEdge = {
      source_id: "node_X",
      target_id: "node_Y",
      relationship: "depends_on",
    };
    expect(edge.source_id).toBe("node_X");
    expect(edge.target_id).toBe("node_Y");
    expect(edge.relationship).toBe("depends_on");
  });
});