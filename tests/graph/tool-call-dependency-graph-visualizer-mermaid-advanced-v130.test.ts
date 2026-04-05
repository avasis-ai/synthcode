import { describe, it, expect } from "vitest";
import {
  GraphVisualizer,
  GraphNode,
  DependencyEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v130";

describe("GraphVisualizer", () => {
  it("should correctly generate a basic mermaid graph for a simple sequence", () => {
    const nodes: GraphNode[] = [
      { id: "user_start", description: "User initiates conversation", type: "user_input", metadata: {} },
      { id: "assistant_call", description: "Assistant calls tool A", type: "tool_call", metadata: {} },
      { id: "tool_result_a", description: "Tool A returns result", type: "tool_result", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { fromNodeId: "user_start", toNodeId: "assistant_call", type: "direct" },
      { fromNodeId: "assistant_call", toNodeId: "tool_result_a", type: "direct" },
    ];

    const visualizer = new GraphVisualizer();
    const mermaidCode = visualizer.generateMermaid(nodes, edges);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user_start[User initiates conversation]");
    expect(mermaidCode).toContain("assistant_call[Assistant calls tool A]");
    expect(mermaidCode).toContain("tool_result_a[Tool A returns result]");
    expect(mermaidCode).toContain("user_start --> assistant_call");
    expect(mermaidCode).toContain("assistant_call --> tool_result_a");
  });

  it("should handle conditional dependencies correctly", () => {
    const nodes: GraphNode[] = [
      { id: "user_input", description: "User asks a question", type: "user_input", metadata: {} },
      { id: "check_condition", description: "Check if tool X is needed", type: "assistant_thought", metadata: {} },
      { id: "path_A", description: "Execute path A", type: "tool_call", metadata: {} },
      { id: "path_B", description: "Execute path B", type: "tool_call", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { fromNodeId: "user_input", toNodeId: "check_condition", type: "direct" },
      { fromNodeId: "check_condition", toNodeId: "path_A", type: "conditional", condition: "condition_A_met" },
      { fromNodeId: "check_condition", toNodeId: "path_B", type: "conditional", condition: "condition_B_met" },
    ];

    const visualizer = new GraphVisualizer();
    const mermaidCode = visualizer.generateMermaid(nodes, edges);

    expect(mermaidCode).toContain("check_condition");
    expect(mermaidCode).toContain("path_A");
    expect(mermaidCode).toContain("path_B");
    expect(mermaidCode).toContain("check_condition -- condition_A_met --> path_A");
    expect(mermaidCode).toContain("check_condition -- condition_B_met --> path_B");
  });

  it("should include precondition edges for tool usage", () => {
    const nodes: GraphNode[] = [
      { id: "user_input", description: "User provides initial context", type: "user_input", metadata: {} },
      { id: "tool_call", description: "Call tool Y", type: "tool_call", metadata: {} },
      { id: "pre_check", description: "Verify required data exists", type: "assistant_thought", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { fromNodeId: "user_input", toNodeId: "pre_check", type: "direct" },
      { fromNodeId: "pre_check", toNodeId: "tool_call", type: "precondition" },
    ];

    const visualizer = new GraphVisualizer();
    const mermaidCode = visualizer.generateMermaid(nodes, edges);

    expect(mermaidCode).toContain("pre_check");
    expect(mermaidCode).toContain("tool_call");
    expect(mermaidCode).toContain("pre_check -- precondition --> tool_call");
  });
});