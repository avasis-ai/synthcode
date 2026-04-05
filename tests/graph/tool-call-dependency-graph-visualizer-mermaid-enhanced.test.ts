import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidEnhanced, DependencyLink } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-enhanced";

describe("ToolCallDependencyGraphVisualizerMermaidEnhanced", () => {
  it("should initialize correctly with messages and dependencies", () => {
    const messages = [
      { type: "user", content: "Hello" } as any,
      { type: "assistant", content: "Hi" } as any,
    ];
    const dependencies: DependencyLink[] = [
      { sourceToolId: "tool1", sourceField: "output", targetToolId: "tool2", targetField: "input" }
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidEnhanced(messages, dependencies);
    expect(visualizer).toBeDefined();
  });

  it("should generate a basic graph structure when no dependencies are provided", () => {
    const messages = [
      { type: "user", content: "What is the weather?" } as any,
      { type: "assistant", content: "Calling weather tool..." } as any,
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidEnhanced(messages);
    // Assuming the method to generate the graph is called 'generateMermaidGraph' or similar
    // We check if the resulting string contains expected elements based on messages
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[User Message]");
  });

  it("should include all specified dependencies in the generated graph", () => {
    const messages = [
      { type: "user", content: "Book a flight" } as any,
      { type: "assistant", content: "Calling flight tool..." } as any,
    ];
    const dependencies: DependencyLink[] = [
      { sourceToolId: "flight_tool", sourceField: "departure", targetToolId: "calendar_tool", targetField: "start_date" }
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidEnhanced(messages, dependencies);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("flight_tool --|> calendar_tool");
    expect(graph).toContain("departure --> start_date");
  });
});