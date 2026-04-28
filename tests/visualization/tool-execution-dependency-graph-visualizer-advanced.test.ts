import { describe, it, expect } from "vitest";
import {
  AdvancedNode,
  ResourceConstraint,
  TemporalConstraint,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-advanced";

describe("AdvancedNode", () => {
  it("should correctly initialize a basic tool_execution node", () => {
    const node: AdvancedNode = {
      id: "tool1",
      label: "Tool A Execution",
      type: "tool_execution",
      metadata: {
        startTime: 1000,
        endTime: 2000,
        resourceConstraints: [{
          resourceName: "CPU",
          requiredAmount: 0.5,
          unit: "core",
        } as ResourceConstraint],
        temporalConstraints: [{
          startTimeMs: 1000,
          durationMs: 1000,
        } as TemporalConstraint],
      },
    };
    expect(node.id).toBe("tool1");
    expect(node.type).toBe("tool_execution");
    expect(node.metadata).toBeDefined();
    expect(node.metadata?.resourceConstraints).toHaveLength(1);
  });

  it("should handle a user_input node with minimal metadata", () => {
    const node: AdvancedNode = {
      id: "user_input_1",
      label: "User Query",
      type: "user_input",
      metadata: {
        // Only required fields might be present for user input
        startTime: 0,
      },
    };
    expect(node.id).toBe("user_input_1");
    expect(node.type).toBe("user_input");
    expect(node.metadata?.startTime).toBe(0);
  });

  it("should correctly structure a system_process node with constraints", () => {
    const node: AdvancedNode = {
      id: "system_proc_2",
      label: "System Processing Step",
      type: "system_process",
      metadata: {
        startTime: 3000,
        resourceConstraints: [
          {
            resourceName: "Memory",
            requiredAmount: 2,
            unit: "GB",
          } as ResourceConstraint,
        ],
        temporalConstraints: [{
          startTimeMs: 3000,
          durationMs: 500,
        } as TemporalConstraint],
      },
    };
    expect(node.id).toBe("system_proc_2");
    expect(node.type).toBe("system_process");
    expect(node.metadata?.resourceConstraints).toHaveLength(1);
    expect(node.metadata?.resourceConstraints![0].resourceName).toBe("Memory");
  });
});