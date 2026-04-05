import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
  GraphNodeId,
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v137-enhanced-v136-final";

describe("GraphNode and GraphEdge structure", () => {
  it("should correctly define a basic GraphNode structure", () => {
    const nodeId: GraphNodeId = "node-1";
    const node: GraphNode = {
      id: nodeId,
      type: "USER_INPUT",
      metadata: { content: "Initial prompt" },
    };
    expect(node.id).toBe(nodeId);
    expect(node.type).toBe("USER_INPUT");
    expect(node.metadata).toEqual({ content: "Initial prompt" });
  });

  it("should correctly define a basic GraphEdge structure", () => {
    const edge: GraphEdge = {
      from: "node-a",
      to: "node-b",
      type: "CALL",
      metadata: { reason: "Function call initiated" },
    };
    expect(edge.from).toBe("node-a");
    expect(edge.to).toBe("node-b");
    expect(edge.type).toBe("CALL");
    expect(edge.metadata).toEqual({ reason: "Function call initiated" });
  });

  it("should handle different edge types correctly", () => {
    const dependsEdge: GraphEdge = {
      from: "node-call",
      to: "node-result",
      type: "DEPENDS_ON",
      metadata: {},
    };
    const flowEdge: GraphEdge = {
      from: "node-result",
      to: "node-next-step",
      type: "FLOW_CONTROL",
      metadata: {},
    };
    expect(dependsEdge.type).toBe("DEPENDS_ON");
    expect(flowEdge.type).toBe("FLOW_CONTROL");
  });
});