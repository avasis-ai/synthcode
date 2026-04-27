import { describe, it, expect } from "vitest";
import { GraphNode } from "../src/visualization/tool-execution-dependency-graph-visualizer-v101";

describe("GraphNode", () => {
  it("should correctly initialize a tool_call node", () => {
    const node: GraphNode = {
      id: "tool1",
      type: "tool_call",
      label: "Tool A Execution",
      temporalMetadata: { startTime: 100, endTime: 200, durationMs: 100 },
      resourceUsage: { cpuUsagePercent: 50, memoryUsageBytes: 1024, networkBytesTransferred: 500 },
      meta: {}
    };
    expect(node.id).toBe("tool1");
    expect(node.type).toBe("tool_call");
    expect(node.label).toBe("Tool A Execution");
    expect(node.temporalMetadata.durationMs).toBe(100);
    expect(node.resourceUsage.cpuUsagePercent).toBe(50);
  });

  it("should correctly initialize an agent_step node", () => {
    const node: GraphNode = {
      id: "agent_step_1",
      type: "agent_step",
      label: "Reasoning Step",
      temporalMetadata: { startTime: 200, endTime: 350, durationMs: 150 },
      resourceUsage: { cpuUsagePercent: 20, memoryUsageBytes: 512, networkBytesTransferred: 100 },
      meta: {}
    };
    expect(node.id).toBe("agent_step_1");
    expect(node.type).toBe("agent_step");
    expect(node.label).toBe("Reasoning Step");
    expect(node.temporalMetadata.startTime).toBe(200);
    expect(node.resourceUsage.memoryUsageBytes).toBe(512);
  });

  it("should correctly initialize a user_input node", () => {
    const node: GraphNode = {
      id: "user_input_1",
      type: "user_input",
      label: "User Prompt",
      temporalMetadata: { startTime: 0, endTime: 50, durationMs: 50 },
      resourceUsage: { cpuUsagePercent: 0, memoryUsageBytes: 0, networkBytesTransferred: 0 },
      meta: {}
    };
    expect(node.id).toBe("user_input_1");
    expect(node.type).toBe("user_input");
    expect(node.label).toBe("User Prompt");
    expect(node.temporalMetadata.durationMs).toBe(50);
    expect(node.resourceUsage.networkBytesTransferred).toBe(0);
  });
});