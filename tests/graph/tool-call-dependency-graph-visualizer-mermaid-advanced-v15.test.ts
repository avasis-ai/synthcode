import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphVisualizerMermaidAdvancedV15,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v15";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV15", () => {
  it("should generate a basic linear graph for sequential tool calls", () => {
    const nodes = [
      {
        id: "start",
        message: { type: "user", content: "Start process" },
        dependencies: [],
      },
      {
        id: "call_tool_a",
        message: { type: "tool_use", content: "Tool A call" },
        dependencies: ["start"],
      },
      {
        id: "call_tool_b",
        message: { type: "tool_result", content: "Tool B result" },
        dependencies: ["call_tool_a"],
      },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV15();
    const mermaidCode = visualizer.generateGraph(nodes);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("start --> call_tool_a");
    expect(mermaidCode).toContain("call_tool_a --> call_tool_b");
  });

  it("should generate a graph with conditional branching (if/else)", () => {
    const nodes = [
      {
        id: "start",
        message: { type: "user", content: "Check condition" },
        dependencies: [],
      },
      {
        id: "if_node",
        message: {
          flow_control: {
            type: "if/else",
            inputs: { condition: "result > 10" },
            branches: {
              success: { condition: "result > 10", next_node_id: "success_branch" },
              failure: { condition: "result <= 10", next_node_id: "failure_branch" },
            },
          },
        },
        dependencies: ["start"],
      },
      {
        id: "success_branch",
        message: { type: "tool_result", content: "Success path" },
        dependencies: ["if_node"],
      },
      {
        id: "failure_branch",
        message: { type: "tool_result", content: "Failure path" },
        dependencies: ["if_node"],
      },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV15();
    const mermaidCode = visualizer.generateGraph(nodes);

    expect(mermaidCode).toContain("if_node");
    expect(mermaidCode).toContain("if_node -- Success --> success_branch");
    expect(mermaidCode).toContain("if_node -- Failure --> failure_branch");
  });

  it("should generate a graph with parallel execution paths", () => {
    const nodes = [
      {
        id: "start",
        message: { type: "user", content: "Start parallel tasks" },
        dependencies: [],
      },
      {
        id: "parallel_node",
        message: {
          flow_control: {
            type: "parallel",
            inputs: { inputs: "data" },
            branches: {},
          },
        },
        dependencies: ["start"],
      },
      {
        id: "task_a",
        message: { type: "tool_use", content: "Task A" },
        dependencies: ["parallel_node"],
      },
      {
        id: "task_b",
        message: { type: "tool_use", content: "Task B" },
        dependencies: ["parallel_node"],
      },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV15();
    const mermaidCode = visualizer.generateGraph(nodes);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("parallel_node");
    expect(mermaidCode).toContain("task_a");
    expect(mermaidCode).toContain("task_b");
  });
});