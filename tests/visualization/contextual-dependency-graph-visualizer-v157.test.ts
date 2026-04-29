import { describe, it, expect } from "vitest";
import {
  DependencyEdge,
  GraphNode,
  DependencyType,
} from "../src/visualization/contextual-dependency-graph-visualizer-v157";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly define the DependencyEdge interface", () => {
    const edge: DependencyEdge = {
      sourceId: "node1",
      targetId: "node2",
      type: "INPUT_REQUIRED",
      reason: "Node 2 requires input from Node 1",
    };
    expect(edge.sourceId).toBe("node1");
    expect(edge.type).toBe("INPUT_REQUIRED");
  });

  it("should correctly define the GraphNode interface", () => {
    const node: GraphNode = {
      id: "msg1",
      type: "message",
      content: "Hello world",
    };
    expect(node.id).toBe("msg1");
    expect(node.type).toBe("message");
  });

  it("should handle various DependencyType values", () => {
    const types: DependencyType[] = [
      "INPUT_REQUIRED",
      "OUTPUT_CONSUMED",
      "PRECONDITION_MET",
      "GENERAL_FLOW",
    ];
    types.forEach((type) => {
      expect(type).toBeDefined();
    });
  });
});