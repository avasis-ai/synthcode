import { describe, it, expect } from "vitest";
import { AdvancedGraphOptions, GraphOptions } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v137";

describe("AdvancedGraphOptions", () => {
  it("should correctly define default layout if not provided", () => {
    const options: GraphOptions = { title: "Test Graph" };
    expect(options.direction).toBeUndefined();
  });

  it("should allow custom node styles", () => {
    const options: AdvancedGraphOptions = {
      title: "Test Graph",
      nodeStyles: {
        "User": { style: "fill:#f9f", class: "user-node" },
        "Assistant": { style: "fill:#ccf", class: "assistant-node" },
      },
    };
    expect(options.nodeStyles).toBeDefined();
    expect(options.nodeStyles?.["User"]?.style).toBe("fill:#f9f");
  });

  it("should allow custom edge styles", () => {
    const options: AdvancedGraphOptions = {
      title: "Test Graph",
      edgeStyles: {
        "ToolUse": { style: "stroke:blue", class: "tool-edge" },
      },
    };
    expect(options.edgeStyles).toBeDefined();
    expect(options.edgeStyles?.["ToolUse"]?.class).toBe("tool-edge");
  });
});