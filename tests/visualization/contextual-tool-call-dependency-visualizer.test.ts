import { describe, it, expect } from "vitest";
import {
  ContextualToolCallDependencyVisualizer,
  ToolCallDependencyPayload,
  DependencyEdge,
  DependencyGraphData,
} from "../src/visualization/contextual-tool-call-dependency-visualizer";

describe("ContextualToolCallDependencyVisualizer", () => {
  it("should correctly generate graph data for simple dependencies", () => {
    const payload: ToolCallDependencyPayload = {
      toolCalls: [
        { id: "call1", name: "toolA", input: { x: 1 }, dependencies: [] },
        { id: "call2", name: "toolB", input: { y: 2 }, dependencies: ["call1"] },
      ],
      executionTrace: [
        { type: "user", content: "Start" },
        { type: "tool_use", content: "call1", toolCallId: "call1" },
        { type: "tool_result", content: "result1", toolCallId: "call1" },
        { type: "tool_use", content: "call2", toolCallId: "call2" },
      ],
    };

    const visualizer = new ContextualToolCallDependencyVisualizer();
    const graphData: DependencyGraphData = visualizer.generateGraphData(payload);

    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.edges).toHaveLength(1);
    expect(graphData.edges[0].sourceToolCallId).toBe("call1");
    expect(graphData.edges[0].targetToolCallId).toBe("call2");
    expect(graphData.edges[0].reason).toContain("call1");
  });

  it("should handle no dependencies when all tool calls are independent", () => {
    const payload: ToolCallDependencyPayload = {
      toolCalls: [
        { id: "callA", name: "toolA", input: { x: 1 }, dependencies: [] },
        { id: "callB", name: "toolB", input: { y: 2 }, dependencies: [] },
      ],
      executionTrace: [
        { type: "user", content: "Start" },
        { type: "tool_use", content: "callA", toolCallId: "callA" },
        { type: "tool_result", content: "resultA", toolCallId: "callA" },
        { type: "tool_use", content: "callB", toolCallId: "callB" },
        { type: "tool_result", content: "resultB", toolCallId: "callB" },
      ],
    };

    const visualizer = new ContextualToolCallDependencyVisualizer();
    const graphData: DependencyGraphData = visualizer.generateGraphData(payload);

    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.edges).toHaveLength(0);
  });

  it("should correctly identify dependencies based on execution trace", () => {
    const payload: ToolCallDependencyPayload = {
      toolCalls: [
        { id: "call1", name: "toolA", input: { x: 1 }, dependencies: [] },
        { id: "call2", name: "toolB", input: { y: 2 }, dependencies: ["call1"] },
      ],
      executionTrace: [
        { type: "user", content: "Start" },
        { type: "tool_use", content: "call1", toolCallId: "call1" },
        { type: "tool_result", content: "result1", toolCallId: "call1" },
        { type: "tool_use", content: "call2", toolCallId: "call2" },
      ],
    };

    const visualizer = new ContextualToolCallDependencyVisualizer();
    const graphData: DependencyGraphData = visualizer.generateGraphData(payload);

    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.edges).toHaveLength(1);
    expect(graphData.edges[0].sourceToolCallId).toBe("call1");
    expect(graphData.edges[0].targetToolCallId).toBe("call2");
  });
});