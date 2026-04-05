import { describe, it, expect } from "vitest";
import { GraphNode, DependencyEdge } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-enhanced-v136-final-v137";

describe("GraphNode and DependencyEdge structure", () => {
  it("should correctly define a basic GraphNode structure", () => {
    const node: GraphNode = {
      id: "node1",
      message: { type: "user", content: "Hello" },
      dependencies: [
        { targetId: "node2", type: "call" },
        { targetId: "node3", type: "conditional", condition: "success" },
      ],
    };
    expect(node.id).toBe("node1");
    expect(node.message).toBeDefined();
    expect(node.dependencies).toHaveLength(2);
    expect(node.dependencies[0].type).toBe("call");
    expect(node.dependencies[1].type).toBe("conditional");
  });

  it("should correctly define a GraphNode with loop metadata", () => {
    const node: GraphNode = {
      id: "loop_node",
      message: { type: "assistant", content: "Looping" },
      dependencies: [{ targetId: "next_node", type: "loop" }],
      metadata: { loop: "while" },
    };
    expect(node.metadata).toBeDefined();
    expect(node.metadata?.loop).toBe("while");
  });

  it("should correctly define a DependencyEdge structure", () => {
    const edge: DependencyEdge = {
      sourceId: "start",
      targetId: "end",
    };
    expect(edge.sourceId).toBe("start");
    expect(edge.targetId).toBe("end");
  });
});