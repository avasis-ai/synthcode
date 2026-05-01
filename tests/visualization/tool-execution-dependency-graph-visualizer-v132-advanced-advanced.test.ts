import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TemporalConstraint,
  AdvancedGraphData,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v132-advanced-advanced";

describe("AdvancedGraphData", () => {
  it("should correctly structure basic graph data", () => {
    const data: AdvancedGraphData = {
      nodes: [
        { id: "nodeA", type: "tool", name: "Tool A", resourceUsage: {
          resourceName: "CPU",
          usageOverTime: [{ timeStep: 0, value: 1 }, { timeStep: 1, value: 1 }],
        },
        { id: "nodeB", type: "tool", name: "Tool B", resourceUsage: {
          resourceName: "Memory",
          usageOverTime: [{ timeStep: 0, value: 0.5 }, { timeStep: 1, value: 0.5 }],
        },
      ],
      dependencies: [
        { predecessorId: "nodeA", successorId: "nodeB", minDelay: 1, maxDelay: 3 },
      ],
      metadata: {
        description: "Test graph data",
        version: "1.0",
      },
    };
    expect(data.nodes).toHaveLength(2);
    expect(data.dependencies).toHaveLength(1);
    expect(data.metadata.description).toBe("Test graph data");
  });

  it("should handle empty graph data gracefully", () => {
    const data: AdvancedGraphData = {
      nodes: [],
      dependencies: [],
      metadata: {
        description: "Empty graph",
        version: "0.1",
      },
    };
    expect(data.nodes).toEqual([]);
    expect(data.dependencies).toEqual([]);
    expect(data.metadata.version).toBe("0.1");
  });

  it("should correctly process multiple complex constraints", () => {
    const data: AdvancedGraphData = {
      nodes: [
        { id: "start", type: "tool", name: "Start", resourceUsage: {
          resourceName: "CPU",
          usageOverTime: [],
        }},
        { id: "middle", type: "tool", name: "Middle", resourceUsage: {
          resourceName: "CPU",
          usageOverTime: [{ timeStep: 0, value: 1 }],
        }},
        { id: "end", type: "tool", name: "End", resourceUsage: {
          resourceName: "CPU",
          usageOverTime: [{ timeStep: 1, value: 1 }],
        }},
      ],
      dependencies: [
        { predecessorId: "start", successorId: "middle", minDelay: 2, maxDelay: 5 },
        { predecessorId: "middle", successorId: "end", minDelay: 1, maxDelay: 1 },
      ],
      metadata: {
        description: "Complex timing test",
        version: "2.0",
      },
    };
    expect(data.dependencies).toHaveLength(2);
    expect(data.dependencies[0].minDelay).toBe(2);
    expect(data.dependencies[1].maxDelay).toBe(1);
  });
});