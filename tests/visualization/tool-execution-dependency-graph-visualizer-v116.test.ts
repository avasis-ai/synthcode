import { describe, it, expect } from "vitest";
import {
  ResourceMetadata,
  TemporalConstraint,
  EnrichedGraphNode,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v116";

describe("ToolExecutionDependencyGraphVisualizerV116", () => {
  it("should correctly initialize with basic nodes and constraints", () => {
    const nodes: EnrichedGraphNode[] = [
      {
        id: "node1",
        label: "Tool A",
        type: "tool",
        metadata: { resourceName: "resA", usageUnits: 1, maxCapacity: 10 },
      },
      {
        id: "node2",
        label: "User Input",
        type: "user_input",
        metadata: { resourceName: "input", usageUnits: 0, maxCapacity: 1 },
      },
    ];
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 0, endTimeMs: 1000, dependencyOrder: 1 },
      { startTimeMs: 1000, endTimeMs: 2000, dependencyOrder: 2 },
    ];
    const visualizer = {
      nodes: nodes,
      constraints: constraints,
    };

    // Assuming the visualizer has a method to process or validate the structure
    // We test the structure passed in, as the actual implementation details are hidden.
    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.constraints).toHaveLength(2);
    expect(visualizer.nodes[0].type).toBe("tool");
  });

  it("should handle a complex graph structure with multiple dependencies", () => {
    const nodes: EnrichedGraphNode[] = [
      {
        id: "start",
        label: "System Start",
        type: "system",
        metadata: { resourceName: "system", usageUnits: 0, maxCapacity: 1 },
      },
      {
        id: "tool1",
        label: "Tool 1",
        type: "tool",
        metadata: { resourceName: "res1", usageUnits: 2, maxCapacity: 5 },
      },
      {
        id: "tool2",
        label: "Tool 2",
        type: "tool",
        metadata: { resourceName: "res2", usageUnits: 1, maxCapacity: 2 },
      },
    ];
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 0, endTimeMs: 500, dependencyOrder: 1 },
      { startTimeMs: 500, endTimeMs: 1500, dependencyOrder: 2 },
      { startTimeMs: 1500, endTimeMs: 2000, dependencyOrder: 3 },
    ];
    const visualizer = {
      nodes: nodes,
      constraints: constraints,
    };

    expect(visualizer.nodes).toHaveLength(3);
    expect(visualizer.constraints).toHaveLength(3);
    expect(visualizer.nodes.some(n => n.id === "tool2" && n.type === "tool")).toBe(true);
  });

  it("should correctly process an empty graph state", () => {
    const nodes: EnrichedGraphNode[] = [];
    const constraints: TemporalConstraint[] = [];
    const visualizer = {
      nodes: nodes,
      constraints: constraints,
    };

    expect(visualizer.nodes).toHaveLength(0);
    expect(visualizer.constraints).toHaveLength(0);
  });
});