import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, AdvancedGraphOptions } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should initialize correctly with basic messages", () => {
    const messages = [
      { role: "user", content: "Hello" } as any,
      { role: "assistant", content: "Hi there" } as any,
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(messages, {});
    expect(visualizer).toBeDefined();
  });

  it("should handle options including loop start and end", () => {
    const messages = [] as any[];
    const options: AdvancedGraphOptions = {
      loopStart: "start",
      loopEnd: "end",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(messages, options);
    // Assuming there's a way to check if options were applied, e.g., by checking internal state or a method call
    // For this test, we just ensure instantiation with options works.
    expect(visualizer).toBeDefined();
  });

  it("should generate a graph structure for a complex sequence of messages", () => {
    const messages = [
      { role: "user", content: "What is the weather?" } as any,
      { role: "assistant", content: "Calling weather tool..." } as any,
      // Simulate tool use and result
      { role: "tool_result", content: "Sunny" } as any,
      { role: "assistant", content: "It is sunny." } as any,
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(messages, {});
    // In a real scenario, we would check the output mermaid string or graph structure.
    // Here, we just ensure the process runs without error.
    expect(visualizer).toBeDefined();
  });
});