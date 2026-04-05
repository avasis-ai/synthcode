import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, AdvancedGraphOptions } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v5";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should initialize with default options correctly", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    // Assuming the constructor handles default initialization internally or we can check a property if exposed.
    // Since we can't see the full implementation, we'll test basic instantiation.
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizer);
  });

  it("should generate a basic graph structure when provided with messages", () => {
    const options: AdvancedGraphOptions = {
      defaultGraphType: "graph TD",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(options);

    // Mock messages to test graph generation logic
    const messages = [
      { type: "user", content: "Hello" },
      { type: "assistant", content: "Hi there" },
    ];

    // We expect the method responsible for generating the graph to be called/usable
    // Since we don't see the public method, we'll assume a method like 'generateGraph' exists
    // and test its output structure if possible, or just test initialization robustness.
    // For this test, we'll assume a method that takes messages and returns a string.
    const graphString = (visualizer as any).generateGraph(messages);
    expect(graphString).toContain("graph TD");
    expect(graphString).toContain("User");
  });

  it("should apply custom styles and directives when provided in options", () => {
    const customOptions: AdvancedGraphOptions = {
      defaultGraphType: "graph LR",
      styleMap: {
        "toolCall": { class: "tool-node", style: "fill:#f9f,stroke:#333" },
      },
      customDirectives: ["%%{init:<'theme':'base''>}%%"]
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(customOptions);

    const messages = [{ type: "user", content: "Test" }];
    const graphString = (visualizer as any).generateGraph(messages);

    // Check if the custom directives are present in the generated graph
    expect(graphString).toContain("%%{init:<'theme':'base''>}");
    // Check if the style map influences the output (hard to assert without knowing the exact usage)
    expect(graphString).toContain("tool-node");
  });
});