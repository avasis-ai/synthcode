import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphMermaidGenerator } from "../src/graph/tool-call-dependency-graph-mermaid-generator";

describe("ToolCallDependencyGraphMermaidGenerator", () => {
  it("should generate a basic mermaid graph for a simple sequence", () => {
    const nodes: any[] = [
      { id: "user_input", label: "User Input", type: "user", details: {} },
      { id: "tool_call_1", label: "Tool A Call", type: "tool", details: {} },
      { id: "assistant_response", label: "Assistant Response", type: "assistant", details: {} },
    ];
    const edges: any[] = [
      { from: "user_input", to: "tool_call_1", label: "Triggers", condition: "" },
      { from: "tool_call_1", to: "assistant_response", label: "Uses Output", condition: "" },
    ];
    const graph = { nodes: nodes, edges: edges };
    const generator = new ToolCallDependencyGraphMermaidGenerator(graph);
    const mermaidCode = generator.generate();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user_input[User Input]");
    expect(mermaidCode).toContain("tool_call_1[Tool A Call]");
    expect(mermaidCode).toContain("user_input -->|Triggers| tool_call_1");
  });

  it("should handle multiple branches and conditions", () => {
    const nodes: any[] = [
      { id: "start", label: "Start", type: "user", details: {} },
      { id: "tool_a", label: "Tool A", type: "tool", details: {} },
      { id: "tool_b", label: "Tool B", type: "tool", details: {} },
      { id: "end", label: "End", type: "assistant", details: {} },
    ];
    const edges: any[] = [
      { from: "start", to: "tool_a", label: "Condition X", condition: "Condition X" },
      { from: "start", to: "tool_b", label: "Condition Y", condition: "Condition Y" },
      { from: "tool_a", to: "end", label: "Success", condition: "" },
      { from: "tool_b", to: "end", label: "Success", condition: "" },
    ];
    const graph = { nodes: nodes, edges: edges };
    const generator = new ToolCallDependencyGraphMermaidGenerator(graph);
    const mermaidCode = generator.generate();

    expect(mermaidCode).toContain("start[Start]");
    expect(mermaidCode).toContain("tool_a[Tool A]");
    expect(mermaidCode).toContain("start -->|Condition X| tool_a");
    expect(mermaidCode).toContain("start -->|Condition Y| tool_b");
  });

  it("should generate an empty graph if no nodes or edges are present", () => {
    const graph = { nodes: [], edges: [] };
    const generator = new ToolCallDependencyGraphMermaidGenerator(graph);
    const mermaidCode = generator.generate();

    expect(mermaidCode).toBe("graph TD\n");
  });
});