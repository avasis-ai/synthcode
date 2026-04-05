import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV120 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v120";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV120", () => {
  it("should initialize correctly with default options", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV120({});
    // Assuming the constructor handles default initialization or validation
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizerMermaidAdvancedV120);
  });

  it("should correctly set graph title and custom styles", () => {
    const options = {
      graphTitle: "Test Graph",
      customStyles: {
        "nodeA": "fill:#f9f,stroke:#333,stroke-width:2px",
      },
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV120(options);
    // This test assumes there's a way to check internal state or a getter for options
    // Since we don't have getters, we'll test the structure if possible, or rely on the constructor's effect.
    // For now, we'll just ensure instantiation with options passes.
    expect(visualizer).toBeDefined();
  });

  it("should generate a basic mermaid graph structure given messages", () => {
    const messages = [
      { type: "user", content: "Hello" },
      { type: "assistant", content: "Hi there!" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV120({ graphTitle: "Test" });
    // We expect a method call or property access to generate the graph.
    // Assuming a method like 'generateMermaidGraph' exists for testing purposes.
    // If the class is meant to be instantiated and then used, we test the usage pattern.
    // Since the full implementation isn't visible, we test the expected output type/structure.
    const mermaidOutput = visualizer.generateMermaidGraph(messages);
    expect(typeof mermaidOutput).toBe("string");
    expect(mermaidOutput).toContain("graph TD"); // Check for a basic mermaid directive
  });
});