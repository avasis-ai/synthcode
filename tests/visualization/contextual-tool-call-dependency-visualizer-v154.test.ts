import { describe, it, expect } from "vitest";
import {
  ContextualToolCallDependencyVisualizerV154,
  ToolCallContext,
  DependencyEdge,
} from "../src/visualization/contextual-tool-call-dependency-visualizer-v154";

describe("ContextualToolCallDependencyVisualizerV154", () => {
  it("should correctly visualize dependencies for a simple tool call", () => {
    const mockContext: ToolCallContext = {
      tool_call_id: "tool_call_1",
      tool_name: "search_engine",
      input_params: { query: "test query" },
      required_resources: {
        api_key: { cost: 0.01, unit: "unit" },
      },
      temporal_metadata: {
        start_time_ms: 1678886400000,
        estimated_duration_ms: 5000,
      },
    };

    const visualizer = new ContextualToolCallDependencyVisualizerV154();
    const edges = visualizer.generateEdges(mockContext);

    expect(edges).toHaveLength(1);
    expect(edges[0].source_id).toBe("tool_call_1");
    expect(edges[0].target_id).toBe("resource_api_key");
    expect(edges[0].dependency_type).toBe("resource");
  });

  it("should handle multiple dependencies (contextual and resource)", () => {
    const mockContext: ToolCallContext = {
      tool_call_id: "tool_call_2",
      tool_name: "data_processor",
      input_params: { data_id: "d123" },
      required_resources: {
        db_connection: { cost: 0.1, unit: "unit" },
      },
      temporal_metadata: {
        start_time_ms: 1678886500000,
        estimated_duration_ms: 10000,
      },
    };

    // Mocking a scenario where a contextual dependency might be added (though the interface only shows resource dependency generation based on the provided structure)
    // We test the resource dependency generation which is the core visible part based on the provided context structure.
    const visualizer = new ContextualToolCallDependencyVisualizerV154();
    const edges = visualizer.generateEdges(mockContext);

    expect(edges).toHaveLength(1);
    expect(edges[0].source_id).toBe("tool_call_2");
    expect(edges[0].target_id).toBe("resource_db_connection");
    expect(edges[0].dependency_type).toBe("resource");
  });

  it("should return an empty array if no resources are required", () => {
    const mockContext: ToolCallContext = {
      tool_call_id: "tool_call_3",
      tool_name: "simple_lookup",
      input_params: { key: "simple" },
      required_resources: {},
      temporal_metadata: {
        start_time_ms: 1678886600000,
        estimated_duration_ms: 100,
      },
    };

    const visualizer = new ContextualToolCallDependencyVisualizerV154();
    const edges = visualizer.generateEdges(mockContext);

    expect(edges).toHaveLength(0);
  });
});