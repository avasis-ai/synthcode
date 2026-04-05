import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV139 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV139", () => {
  it("should correctly generate a basic sequential graph", () => {
    const startMessage: any = { id: "msg1", content: "Start" };
    const endMessage: any = { id: "msg2", content: "End" };
    const config: any = {
      startMessage,
      endMessage,
      toolCalls: [
        { fromId: "msg1", toId: "msg2", type: "sequential" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV139(config);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("msg1 --> msg2");
  });

  it("should handle conditional dependencies", () => {
    const startMessage: any = { id: "msgA", content: "A" };
    const endMessage: any = { id: "msgB", content: "B" };
    const config: any = {
      startMessage,
      endMessage,
      toolCalls: [
        { fromId: "msgA", toId: "msgB", type: "conditional", condition: "if condition" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV139(config);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("A -- if condition --> B");
  });

  it("should handle multiple parallel dependencies", () => {
    const startMessage: any = { id: "msgStart", content: "Start" };
    const endMessage: any = { id: "msgEnd", content: "End" };
    const config: any = {
      startMessage,
      endMessage,
      toolCalls: [
        { fromId: "msgStart", toId: "msgEnd", type: "parallel" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV139(config);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("msgStart -->|parallel| msgEnd");
  });
});