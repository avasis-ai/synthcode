import { describe, it, expect } from "vitest";
import {
  ToolExecutionDependencyVisualizer,
  VisualizationData,
  ExecutionStep,
  ToolCallDetail,
} from "../src/visualization/tool-execution-dependency-visualizer";

describe("ToolExecutionDependencyVisualizer", () => {
  it("should correctly visualize a single tool call execution", () => {
    const mockData: VisualizationData = {
      steps: [
        {
          message: { type: "user", content: "What is the weather?" },
          toolCalls: [
            {
              toolName: "get_weather",
              toolId: "call_1",
              input: { location: "London" },
              output: "Sunny and 20C",
              isError: false,
            },
          ],
        },
      ],
    };
    const visualizer = new ToolExecutionDependencyVisualizer();
    const result = visualizer.visualize(mockData);
    expect(result).toHaveLength(1);
    expect(result[0].toolCalls).toHaveLength(1);
    expect(result[0].toolCalls[0].toolName).toBe("get_weather");
  });

  it("should handle multiple sequential tool calls", () => {
    const mockData: VisualizationData = {
      steps: [
        {
          message: { type: "user", content: "First step" },
          toolCalls: [
            {
              toolName: "tool_a",
              toolId: "call_a",
              input: {},
              output: "Result A",
              isError: false,
            },
          ],
        },
        {
          message: { type: "assistant", content: "Second step", toolCalls: [] },
          toolCalls: [
            {
              toolName: "tool_b",
              toolId: "call_b",
              input: { param: 1 },
              output: "Result B",
              isError: false,
            },
          ],
        },
      ],
    };
    const visualizer = new ToolExecutionDependencyVisualizer();
    const result = visualizer.visualize(mockData);
    expect(result).toHaveLength(2);
    expect(result[1].toolCalls).toHaveLength(1);
    expect(result[1].toolCalls[0].toolName).toBe("tool_b");
  });

  it("should correctly process a step with no tool calls", () => {
    const mockData: VisualizationData = {
      steps: [
        {
          message: { type: "assistant", content: "Final answer.", toolCalls: [] },
          toolCalls: [],
        },
      ],
    };
    const visualizer = new ToolExecutionDependencyVisualizer();
    const result = visualizer.visualize(mockData);
    expect(result).toHaveLength(1);
    expect(result[0].toolCalls).toHaveLength(0);
  });
});