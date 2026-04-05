import { describe, it, expect } from "vitest";
import {
  DependencyEdge,
  GraphNode,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced-v136-final";

describe("DependencyEdge and GraphNode interfaces", () => {
  it("should correctly define the structure for DependencyEdge", () => {
    const edge: DependencyEdge = {
      fromNodeId: "nodeA",
      toNodeId: "nodeB",
      type: "call",
      condition: "if success",
    };
    expect(edge).toBeDefined();
    expect(edge.fromNodeId).toBe("nodeA");
    expect(edge.type).toBe("call");
    if (edge.condition) {
      expect(edge.condition).toBe("if success");
    }
  });

  it("should correctly define the structure for GraphNode", () => {
    const node: GraphNode = {
      id: "startNode",
      type: "start",
      content: "Start of the process",
      metadata: { source: "system" },
    };
    expect(node).toBeDefined();
    expect(node.id).toBe("startNode");
    expect(node.type).toBe("start");
    expect(node.content).toBe("Start of the process");
  });

  it("should handle different node types and edge types", () => {
    const node: GraphNode = {
      id: "user1",
      type: "user",
      content: "What is the weather?",
    };
    const edge: DependencyEdge = {
      fromNodeId: "user1",
      toNodeId: "toolCall1",
      type: "conditional",
      condition: "weather_api_called",
    };
    expect(node.type).toBe("user");
    expect(edge.type).toBe("conditional");
  });
});