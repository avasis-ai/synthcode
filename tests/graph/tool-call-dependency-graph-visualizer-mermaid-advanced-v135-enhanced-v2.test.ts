import { describe, it, expect } from "vitest";
import {
  AdvancedGraphOptions,
  GraphData,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced-v2";
import {generateMermaidGraph} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced-v2";

describe("generateMermaidGraph", () => {
  it("should generate a basic graph for a simple user-assistant exchange", () => {
    const graphData: GraphData = {
      nodes: [
        {id: "user", type: "user", label: "User Input"},
        {id: "assistant", type: "assistant", label: "Assistant Response"},
      ],
      edges: [
        {source: "user", target: "assistant", type: "message"},
      ],
    };
    const mermaid = generateMermaidGraph(graphData);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("user[User Input]");
    expect(mermaid).toContain("assistant[Assistant Response]");
    expect(mermaid).toContain("user --> assistant");
  });

  it("should generate a graph including a tool call and result", () => {
    const graphData: GraphData = {
      nodes: [
        {id: "user", type: "user", label: "User Query"},
        {id: "assistant", type: "assistant", label: "Tool Call"},
        {id: "tool_result", type: "tool_result", label: "Tool Output"},
      ],
      edges: [
        {source: "user", target: "assistant", type: "message"},
        {source: "assistant", target: "tool_result", type: "tool_use"},
      ],
    };
    const mermaid = generateMermaidGraph(graphData);
    expect(mermaid).toContain("user[User Query]");
    expect(mermaid).toContain("assistant[Tool Call]");
    expect(mermaid).toContain("tool_result[Tool Output]");
    expect(mermaid).toContain("assistant --> tool_result");
  });

  it("should apply global and custom styling directives correctly", () => {
    const graphData: GraphData = {
      nodes: [
        {id: "start", type: "user", label: "Start"},
        {id: "end", type: "assistant", label: "End"},
      ],
      edges: [
        {source: "start", target: "end", type: "message"},
      ],
    };
    const options: AdvancedGraphOptions = {
      globalDirectives: "classDef default fill:#eee,stroke:#333,stroke-width:2px;",
      customStyles: {
        user: "classDef user fill:#ccf,stroke:#00f;",
        assistant: "classDef assistant fill:#cfc,stroke:#0a0;",
      },
    };
    const mermaid = generateMermaidGraph(graphData, options);
    expect(mermaid).toContain("classDef default fill:#eee,stroke:#333,stroke-width:2px;");
    expect(mermaid).toContain("classDef user fill:#ccf,stroke:#00f;");
    expect(mermaid).toContain("classDef assistant fill:#cfc,stroke:#0a0;");
  });
});