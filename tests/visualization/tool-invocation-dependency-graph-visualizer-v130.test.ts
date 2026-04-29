import { describe, it, expect } from "vitest";
import { ToolInvocationDependencyGraphVisualizer, ToolInvocation, DependencyGraphData } from "../src/visualization/tool-invocation-dependency-graph-visualizer-v130";

describe("ToolInvocationDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ToolInvocationDependencyGraphVisualizer();
    expect(visualizer).toBeInstanceOf(ToolInvocationDependencyGraphVisualizer);
    expect(visualizer.getGraphData()).toEqual({ invocations: [], messageHistory: [] });
  });

  it("should process a single tool invocation correctly", () => {
    const mockInvocations: ToolInvocation[] = [
      {
        toolName: "toolA",
        toolId: "id1",
        startTime: 100,
        endTime: 200,
        requiredResources: { cpu: 1, memory: 2 },
        dependencies: ["dep1"],
      },
    ];
    const mockHistory: Message[] = [{ role: "user", content: "Hello" }];
    const data: DependencyGraphData = { invocations: mockInvocations, messageHistory: mockHistory };

    const visualizer = new ToolInvocationDependencyGraphVisualizer(data);
    const graphData = visualizer.getGraphData();

    expect(graphData.invocations).toHaveLength(1);
    expect(graphData.invocations[0].toolName).toBe("toolA");
  });

  it("should handle multiple tool invocations and message history", () => {
    const mockInvocations: ToolInvocation[] = [
      {
        toolName: "toolA",
        toolId: "id1",
        startTime: 100,
        endTime: 200,
        requiredResources: { cpu: 1, memory: 2 },
        dependencies: ["dep1"],
      },
      {
        toolName: "toolB",
        toolId: "id2",
        startTime: 300,
        endTime: 400,
        requiredResources: { cpu: 1, memory: 1 },
        dependencies: ["dep1", "dep2"],
      },
    ];
    const mockHistory: Message[] = [
      { role: "user", content: "Initial query" },
      { role: "assistant", content: "Tool call A" },
      { role: "tool_result", content: "Result A" },
    ];
    const data: DependencyGraphData = { invocations: mockInvocations, messageHistory: mockHistory };

    const visualizer = new ToolInvocationDependencyGraphVisualizer(data);
    const graphData = visualizer.getGraphData();

    expect(graphData.invocations).toHaveLength(2);
    expect(graphData.messageHistory).toHaveLength(3);
    expect(graphData.invocations[1].toolName).toBe("toolB");
  });
});