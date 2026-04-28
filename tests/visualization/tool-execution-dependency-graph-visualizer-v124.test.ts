import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizer,
  NodeMetadata,
  TemporalConstraint,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v124";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with basic metadata", () => {
    const metadata: NodeMetadata = {
      nodeId: "node1",
      type: "tool_execution",
      startTime: 100,
      endTime: 200,
      resourceUsage: {},
    };
    const visualizer = new DependencyGraphVisualizer([metadata]);
    expect(visualizer.getNodes()).toHaveLength(1);
    expect(visualizer.getNode("node1")).toEqual(metadata);
  });

  it("should correctly add temporal constraints", () => {
    const metadata: NodeMetadata = {
      nodeId: "nodeA",
      type: "tool_execution",
      startTime: 0,
      endTime: 100,
      resourceUsage: {},
    };
    const constraints: TemporalConstraint[] = [
      { predecessorId: "nodeA", successorId: "nodeB", minDelayMs: 10, maxDelayMs: 50 },
    ];
    const visualizer = new DependencyGraphVisualizer([metadata]);
    (visualizer as any).addConstraints(constraints);

    const constraintsList = visualizer.getConstraints();
    expect(constraintsList).toHaveLength(1);
    expect(constraintsList[0]).toEqual(constraints[0]);
  });

  it("should handle multiple nodes and constraints", () => {
    const metadata1: NodeMetadata = {
      nodeId: "n1",
      type: "agent_step",
      startTime: 0,
      endTime: 50,
      resourceUsage: {},
    };
    const metadata2: NodeMetadata = {
      nodeId: "n2",
      type: "tool_execution",
      startTime: 60,
      endTime: 150,
      resourceUsage: {},
    };
    const constraints: TemporalConstraint[] = [
      { predecessorId: "n1", successorId: "n2", minDelayMs: 10, maxDelayMs: 20 },
    ];
    const visualizer = new DependencyGraphVisualizer([metadata1, metadata2]);
    (visualizer as any).addConstraints(constraints);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getConstraints()).toHaveLength(1);
  });
});