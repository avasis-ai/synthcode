import { describe, it, expect } from "vitest";
import { MermaidGraphVisualizer, GraphNode, GraphEdge, DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor-fix-v2";

describe("MermaidGraphVisualizer", () => {
  it("should generate a basic graph diagram from simple nodes and edges", () => {
    const nodes: GraphNode[] = [
      { id: "A", type: "user", content: [{ type: "text", text: "Start" }] },
      { id: "B", type: "assistant", content: [{ type: "text", text: "Response" }] },
    ];
    const edges: GraphEdge[] = [
      { from: "A", to: "B" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    const visualizer = new MermaidGraphVisualizer();
    const mermaidCode = visualizer.generate(graph);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[Start]");
    expect(mermaidCode).toContain("B[Response]");
    expect(mermaidCode).toContain("A --> B");
  });

  it("should handle multiple connections and different node types", () => {
    const nodes: GraphNode[] = [
      { id: "user", type: "user", content: [{ type: "text", text: "Query" }] },
      { id: "tool1", type: "tool", content: [{ type: "text", text: "Tool Call 1" }] },
      { id: "assistant", type: "assistant", content: [{ type: "text", text: "Final Answer" }] },
    ];
    const edges: GraphEdge[] = [
      { from: "user", to: "tool1", label: "calls" },
      { from: "tool1", to: "assistant", condition: "success" },
      { from: "user", to: "assistant", condition: "fallback" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    const visualizer = new MermaidGraphVisualizer();
    const mermaidCode = visualizer.generate(graph);

    expect(mermaidCode).toContain("user[Query]");
    expect(mermaidCode).toContain("tool1[Tool Call 1]");
    expect(mermaidCode).toContain("assistant[Final Answer]");
    expect(mermaidCode).toContain("user -- calls --> tool1");
    expect(mermaidCode).toContain("tool1 -- success --> assistant");
    expect(mermaidCode).toContain("user -- fallback --> assistant");
  });

  it("should correctly represent a loop edge", () => {
    const nodes: GraphNode[] = [
      { id: "loop_node", type: "assistant", content: [{ type: "text", text: "Looping" }] },
    ];
    const edges: GraphEdge[] = [
      { from: "loop_node", to: "loop_node", isLoop: true, label: "retry" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    const visualizer = new MermaidGraphVisualizer();
    const mermaidCode = visualizer.generate(graph);

    expect(mermaidCode).toContain("loop_node[Looping]");
    // Mermaid syntax for loops can vary, checking for the general structure
    expect(mermaidCode).toContain("loop_node -- retry --> loop_node");
  });
});