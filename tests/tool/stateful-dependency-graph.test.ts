import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/tool/stateful-dependency-graph";

describe("DependencyGraph", () => {
  it("should initialize with empty nodes and history", () => {
    const graph = new DependencyGraph();
    expect(graph.nodes.size).toBe(0);
    expect(graph.history.length).toBe(0);
  });

  it("should add a dependency node correctly", () => {
    const graph = new DependencyGraph();
    const node: DependencyNode = {
      sourceInvocationId: "inv-123",
      targetToolName: "search_tool",
      reasoningContext: "Need to find current weather.",
      dependencyType: "FULFILLS",
    };
    graph.addDependency(node);
    expect(graph.nodes.has("inv-123")).toBe(true);
    expect(graph.nodes.get("inv-123")).toEqual(node);
  });

  it("should correctly update the history with a new tool result", () => {
    const graph = new DependencyGraph();
    const historyItem: ToolResultMessage = {
      tool_name: "weather_api",
      result: "Sunny with a high of 25C.",
      invocation_id: "inv-456",
      timestamp: Date.now(),
    };
    graph.addToolResult(historyItem);
    expect(graph.history.length).toBe(1);
    expect(graph.history[0]).toEqual(historyItem);
  });
});