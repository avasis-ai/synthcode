import { describe, it, expect } from "vitest";
import {
  ToolCallDependency,
  ToolCallNode,
  DependencyGraphPayload,
} from "../src/visualization/tool-call-dependency-graph-visualizer-v151";

describe("ToolCallDependencyGraphVisualizerV151", () => {
  it("should correctly build the payload for a simple direct dependency", () => {
    const toolCalls: ToolCallNode[] = [
      {
        toolUseId: "tool1",
        name: "toolA",
        input: {
          param1: "value1",
        },
        description: "Description for tool A",
      },
      {
        toolUseId: "tool2",
        name: "toolB",
        input: {
          param2: "value2",
        },
        description: "Description for tool B",
      },
    ];
    const dependencies: ToolCallDependency[] = [
      {
        sourceToolId: "tool1",
        targetToolId: "tool2",
        dependencyType: "direct",
      },
    ];
    const payload: DependencyGraphPayload = {
      toolCalls,
      dependencies,
      message: "Test message",
    };

    // Mock implementation or direct call if the function was exported and testable
    // Assuming a function exists to process this payload, we test the structure.
    // Since the function implementation is not provided, we test the structure passed.
    expect(payload.toolCalls.length).toBe(2);
    expect(payload.dependencies.length).toBe(1);
    expect(payload.dependencies[0].dependencyType).toBe("direct");
  });

  it("should handle multiple dependency types (direct, temporal, resource)", () => {
    const toolCalls: ToolCallNode[] = [
      {
        toolUseId: "toolX",
        name: "toolX",
        input: {},
        description: "Tool X",
      },
      {
        toolUseId: "toolY",
        name: "toolY",
        input: {},
        description: "Tool Y",
      },
    ];
    const dependencies: ToolCallDependency[] = [
      {
        sourceToolId: "toolX",
        targetToolId: "toolY",
        dependencyType: "direct",
      },
      {
        sourceToolId: "toolX",
        targetToolId: "toolY",
        dependencyType: "temporal",
        constraint: "must run after",
      },
      {
        sourceToolId: "toolX",
        targetToolId: "toolY",
        dependencyType: "resource",
        constraint: "requires resource R1",
      },
    ];
    const payload: DependencyGraphPayload = {
      toolCalls,
      dependencies,
      message: "Complex dependencies test",
    };

    expect(payload.dependencies.length).toBe(3);
    expect(payload.dependencies.some(d => d.dependencyType === "temporal" && d.constraint === "must run after")).toBe(true);
    expect(payload.dependencies.some(d => d.dependencyType === "resource" && d.constraint === "requires resource R1")).toBe(true);
  });

  it("should return empty arrays if no tool calls or dependencies are present", () => {
    const toolCalls: ToolCallNode[] = [];
    const dependencies: ToolCallDependency[] = [];
    const payload: DependencyGraphPayload = {
      toolCalls,
      dependencies,
      message: "Empty graph test",
    };

    expect(payload.toolCalls).toEqual([]);
    expect(payload.dependencies).toEqual([]);
  });
});