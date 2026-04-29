import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphVisualizer } from "../src/visualization/tool-execution-dependency-graph-visualizer-v139";
import { ToolExecutionHistory, ToolExecutionDependencyGraphPayload } from "../src/visualization/types";

describe("ToolExecutionDependencyGraphVisualizer", () => {
  it("should build a basic graph structure from minimal valid inputs", () => {
    const mockHistory: ToolExecutionHistory = {
      executions: [],
      toolCalls: [],
    };
    const mockPayload: ToolExecutionDependencyGraphPayload = {
      dependencies: [],
      rootToolCallId: "root-call-id",
    };

    const visualizer = new ToolExecutionDependencyGraphVisualizer(mockHistory, mockPayload);
    const graph = visualizer.buildGraphStructure();

    expect(graph.nodes).toBeInstanceOf(Array);
    expect(graph.edges).toBeInstanceOf(Array);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
    expect(graph.edges.length).toBeGreaterThanOrEqual(0);
  });

  it("should correctly include nodes for root tool calls and dependencies", () => {
    const mockHistory: ToolExecutionHistory = {
      executions: [{ toolCallId: "exec-1", toolCall: { id: "call-1" } }],
      toolCalls: [{ id: "call-1", toolName: "toolA" }],
    };
    const mockPayload: ToolExecutionDependencyGraphPayload = {
      dependencies: [{ sourceId: "call-1", targetId: "call-2" }],
      rootToolCallId: "call-1",
    };

    const visualizer = new ToolExecutionDependencyGraphVisualizer(mockHistory, mockPayload);
    const graph = visualizer.buildGraphStructure();

    // Expect at least the root call and the dependency target to be nodes
    expect(graph.nodes.some((node: any) => node.id === "call-1")).toBe(true);
    expect(graph.nodes.some((node: any) => node.id === "call-2")).toBe(true);
  });

  it("should generate edges representing all defined dependencies", () => {
    const mockHistory: ToolExecutionHistory = {
      executions: [],
      toolCalls: [],
    };
    const mockPayload: ToolExecutionDependencyGraphPayload = {
      dependencies: [
        { sourceId: "call-A", targetId: "call-B" },
        { sourceId: "call-B", targetId: "call-C" },
      ],
      rootToolCallId: "call-A",
    };

    const visualizer = new ToolExecutionDependencyGraphVisualizer(mockHistory, mockPayload);
    const graph = visualizer.buildGraphStructure();

    expect(graph.edges.length).toBe(2);
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { source: "call-A", target: "call-B" },
        { source: "call-B", target: "call-C" },
      ])
    );
  });
});