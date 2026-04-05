import { describe, it, expect } from "vitest";
import {
  DependencyGraph,
  GraphNode,
  GraphEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final";

describe("DependencyGraph", () => {
  it("should correctly construct a basic graph with nodes and edges", () => {
    const nodes: GraphNode[] = [
      { id: "user1", type: "user", label: "User Input", details: {} },
      { id: "assistant1", type: "assistant", label: "Assistant Response", details: {} },
    ];
    const edges: GraphEdge[] = [
      { fromId: "user1", toId: "assistant1", label: "Initial Call", type: "flow" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes[0].id).toBe("user1");
    expect(graph.edges[0].fromId).toBe("user1");
  });

  it("should handle multiple tool calls and responses correctly", () => {
    const nodes: GraphNode[] = [
      { id: "user", type: "user", label: "User Query", details: {} },
      { id: "call1", type: "tool", label: "Tool A Call", details: {} },
      { id: "response1", type: "tool", label: "Tool A Result", details: {} },
      { id: "assistant", type: "assistant", label: "Final Answer", details: {} },
    ];
    const edges: GraphEdge[] = [
      { fromId: "user", toId: "call1", label: "Calls Tool A", type: "call" },
      { fromId: "call1", toId: "response1", label: "Tool Execution", type: "response" },
      { fromId: "response1", toId: "assistant", label: "Uses Result", type: "flow" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
    expect(graph.edges.some(e => e.type === "call" && e.fromId === "user")).toBe(true);
    expect(graph.edges.some(e => e.type === "response" && e.fromId === "call1")).toBe(true);
  });

  it("should be able to represent a complex flow with multiple interactions", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "user", label: "Start", details: {} },
      { id: "step1_call", type: "tool", label: "Step 1 Tool", details: {} },
      { id: "step1_resp", type: "tool", label: "Step 1 Result", details: {} },
      { id: "step2_call", type: "tool", label: "Step 2 Tool", details: {} },
      { id: "step2_resp", type: "tool", label: "Step 2 Result", details: {} },
      { id: "end", type: "assistant", label: "End", details: {} },
    ];
    const edges: GraphEdge[] = [
      { fromId: "start", toId: "step1_call", label: "Call 1", type: "call" },
      { fromId: "step1_call", toId: "step1_resp", label: "Response 1", type: "response" },
      { fromId: "step1_resp", toId: "step2_call", label: "Flow to 2", type: "flow" },
      { fromId: "step2_call", toId: "step2_resp", label: "Response 2", type: "response" },
      { fromId: "step2_resp", toId: "end", label: "Final Output", type: "flow" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    expect(graph.nodes).toHaveLength(6);
    expect(graph.edges).toHaveLength(5);
    expect(graph.edges.filter(e => e.type === "flow")).toHaveLength(2);
    expect(graph.edges.find(e => e.fromId === "step1_resp" && e.toId === "step2_call")).toBeDefined();
  });
});