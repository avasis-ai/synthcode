import { describe, it, expect } from "vitest";
import { GraphNode, ResourceUsage, TemporalConstraint } from "../src/visualization/tool-execution-dependency-graph-visualizer-v33";

describe("GraphNode", () => {
  it("should correctly initialize a basic tool_execution node", () => {
    const node: GraphNode = {
      id: "tool1",
      label: "Tool A Execution",
      type: "tool_execution",
      metadata: { tool_name: "tool_a", version: "1.0" },
      resource_usage: { cpu_cores: 2, memory_gb: 4, network_throughput_mbps: 100 },
      temporal_constra: { start_time_ms: 1000, duration_ms: 5000 },
    };
    expect(node.id).toBe("tool1");
    expect(node.type).toBe("tool_execution");
    expect(node.resource_usage.cpu_cores).toBe(2);
    expect(node.temporal_constra.start_time_ms).toBe(1000);
  });

  it("should handle user_input node structure", () => {
    const node: GraphNode = {
      id: "user_input_1",
      label: "User Query",
      type: "user_input",
      metadata: { input_text: "What is the weather?" },
      resource_usage: { cpu_cores: 0, memory_gb: 0, network_throughput_mbps: 0 },
      temporal_constra: { start_time_ms: 0, duration_ms: 100 },
    };
    expect(node.type).toBe("user_input");
    expect(node.metadata.input_text).toBe("What is the weather?");
    expect(node.resource_usage.cpu_cores).toBe(0);
  });

  it("should correctly structure a system_process node", () => {
    const node: GraphNode = {
      id: "system_init",
      label: "System Initialization",
      type: "system_process",
      metadata: { process_id: "sys_001" },
      resource_usage: { cpu_cores: 1, memory_gb: 1, network_throughput_mbps: 50 },
      temporal_constra: { start_time_ms: 0, duration_ms: 500 },
    };
    expect(node.type).toBe("system_process");
    expect(node.metadata.process_id).toBe("sys_001");
    expect(node.resource_usage.memory_gb).toBe(1);
  });
});