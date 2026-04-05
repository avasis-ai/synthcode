import { describe, it, expect } from "vitest";
import { AdvancedGraphConfig } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v4";
import { generateMermaidGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v4";

describe("generateMermaidGraph", () => {
  it("should generate a basic graph structure from messages", () => {
    const messages = [
      { type: "user", content: "Start" },
      { type: "assistant", content: "Process" },
    ];
    const config: AdvancedGraphConfig = { defaultGraphType: "graph TD" };
    const mermaid = generateMermaidGraph(messages, config);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("A[Start]");
    expect(mermaid).toContain("B[Process]");
    expect(mermaid).toContain("A --> B");
  });

  it("should incorporate tool calls and results into the graph", () => {
    const messages = [
      { type: "user", content: "Call Tool A" },
      { type: "assistant", content: "ToolUse", toolName: "ToolA", toolInput: "input1" },
      { type: "toolResult", content: "Result A", toolName: "ToolA", result: "output1" },
      { type: "assistant", content: "Final step", toolName: "ToolB", toolInput: "input2" },
    ];
    const config: AdvancedGraphConfig = { defaultGraphType: "graph LR" };
    const mermaid = generateMermaidGraph(messages, config);
    expect(mermaid).toContain("graph LR");
    expect(mermaid).toContain("User_Call_ToolA[Call Tool A]");
    expect(mermaid).toContain("ToolA_Use[ToolA]");
    expect(mermaid).toContain("ToolA_Result[Result A]");
    expect(mermaid).toContain("ToolB_Use[ToolB]");
  });

  it("should apply custom styles and dependency edges", () => {
    const messages = [
      { type: "user", content: "Start" },
      { type: "assistant", content: "Middle" },
    ];
    const config: AdvancedGraphConfig = {
      defaultGraphType: "graph TD",
      style: {
        node: {
          "Start": "fill:#f9f,stroke:#333,stroke-width:2px",
          "Middle": "fill:#ccf,stroke:#333,stroke-width:2px",
        },
        edge: {
          "Start_to_Middle": "stroke:blue,stroke-width:2px",
        },
      },
      dependencyEdges: {
        "Start": {
          source: "Start",
          target: "Middle",
          label: "via dependency",
        },
      },
    };
    const mermaid = generateMermaidGraph(messages, config);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("Start{Start}");
    expect(mermaid).toContain("Middle{Middle}");
    expect(mermaid).toContain("Start -->|via dependency| Middle");
    expect(mermaid).toContain("style Start fill:#f9f,stroke:#333,stroke-width:2px");
  });
});