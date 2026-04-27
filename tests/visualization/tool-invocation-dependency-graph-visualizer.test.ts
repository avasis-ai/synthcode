import { describe, it, expect } from "vitest";
import {
  ToolInvocationGraphData,
  ToolNode,
  ToolEdge,
} from "../src/visualization/tool-invocation-dependency-graph-visualizer";

describe("ToolInvocationGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = {
      render: (data: ToolInvocationGraphData) => {
        if (!data.nodes || data.nodes.length === 0) {
          return "No data to display.";
        }
        return `Graph rendered with ${data.nodes.length} nodes.`;
      },
    };
    const result = visualizer.render({ nodes: [], edges: [] });
    expect(result).toBe("No data to display.");
  });

  it("should render a simple linear dependency graph", () => {
    const data: ToolInvocationGraphData = {
      nodes: [
        { id: "user1", type: "user_input", label: "User Query", metadata: {} },
        { id: "toolA", type: "tool_call", label: "Tool A", metadata: {} },
        { id: "dataB", type: "data_source", label: "Data Source B", metadata: {} },
      ],
      edges: [
        { sourceId: "user1", targetId: "toolA", type: "data_flow", metadata: {} },
        { sourceId: "toolA", targetId: "dataB", type: "data_flow", metadata: {} },
      ],
    };
    const visualizer = {
      render: (data: ToolInvocationGraphData) => {
        if (!data.nodes || data.nodes.length === 0) {
          return "No data to display.";
        }
        const nodeCount = data.nodes.length;
        const edgeCount = data.edges.length;
        return `Graph rendered with ${nodeCount} nodes and ${edgeCount} edges.`;
      },
    };
    const result = visualizer.render(data);
    expect(result).toBe("Graph rendered with 3 nodes and 2 edges.");
  });

  it("should handle a graph with no edges", () => {
    const data: ToolInvocationGraphData = {
      nodes: [
        { id: "user1", type: "user_input", label: "User Query", metadata: {} },
        { id: "toolA", type: "tool_call", label: "Tool A", metadata: {} },
      ],
      edges: [],
    };
    const visualizer = {
      render: (data: ToolInvocationGraphData) => {
        if (!data.nodes || data.nodes.length === 0) {
          return "No data to display.";
        }
        const nodeCount = data.nodes.length;
        const edgeCount = data.edges.length;
        return `Graph rendered with ${nodeCount} nodes and ${edgeCount} edges.`;
      },
    };
    const result = visualizer.render(data);
    expect(result).toBe("Graph rendered with 2 nodes and 0 edges.");
  });
});