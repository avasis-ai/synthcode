import { describe, it, expect } from "vitest";
import { GraphContext } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v140-final-v138-final-v139-new-fix-v2";
import { generateMermaidGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v140-final-v138-final-v139-new-fix-v2";

describe("generateMermaidGraph", () => {
  it("should generate a basic linear graph", () => {
    const context: GraphContext = {
      nodes: {
        "start": { id: "start", label: "Start", type: "start" },
        "process1": { id: "process1", label: "Process Step 1", type: "process" },
        "end": { id: "end", label: "End", type: "end" },
      },
      edges: [
        { from: "start", to: "process1", label: "Always", type: "flow" },
        { from: "process1", to: "end", label: "Success", type: "flow" },
      ],
    };
    const mermaid = generateMermaidGraph(context);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("start --> process1");
    expect(mermaid).toContain("process1 --> end");
  });

  it("should handle decision nodes with multiple paths", () => {
    const context: GraphContext = {
      nodes: {
        "start": { id: "start", label: "Start", type: "start" },
        "decision": { id: "decision", label: "Decision Point", type: "decision" },
        "success": { id: "success", label: "Success Path", type: "process" },
        "failure": { id: "failure", label: "Failure Path", type: "process" },
        "end": { id: "end", label: "End", type: "end" },
      },
      edges: [
        { from: "start", to: "decision", label: "", type: "flow" },
        { from: "decision", to: "success", label: "True", type: "flow" },
        { from: "decision", to: "failure", label: "False", type: "flow" },
        { from: "success", to: "end", label: "", type: "flow" },
        { from: "failure", to: "end", label: "", type: "flow" },
      ],
    };
    const mermaid = generateMermaidGraph(context);
    expect(mermaid).toContain("decision -- True --> success");
    expect(mermaid).toContain("decision -- False --> failure");
  });

  it("should include tool call edges with labels", () => {
    const context: GraphContext = {
      nodes: {
        "start": { id: "start", label: "Start", type: "start" },
        "call_tool": { id: "call_tool", label: "Call Tool A", type: "process" },
        "end": { id: "end", label: "End", type: "end" },
      },
      edges: [
        { from: "start", to: "call_tool", label: "Use Tool A", type: "call" },
        { from: "call_tool", to: "end", label: "Done", type: "flow" },
      ],
    };
    const mermaid = generateMermaidGraph(context);
    expect(mermaid).toContain("start -- Use Tool A --> call_tool");
    expect(mermaid).toContain("call_tool --> end");
  });
});