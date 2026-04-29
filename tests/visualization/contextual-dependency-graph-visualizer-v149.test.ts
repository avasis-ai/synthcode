import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  NodePayload,
  ResourceConstraint,
  TemporalConstraint,
} from "../src/visualization/contextual-dependency-graph-visualizer-v149";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes", () => {
    const nodes: NodePayload[] = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(nodes);
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getNodes().some(n => n.id === "A" && n.label === "Node A")).toBe(true);
  });

  it("should correctly add a node with temporal and resource constraints", () => {
    const initialNodes: NodePayload[] = [{ id: "Start", label: "Start" }];
    const visualizer = new ContextualDependencyGraphVisualizer(initialNodes);

    const constrainedNode: NodePayload = {
      id: "Process",
      label: "Process Data",
      constraints: {
        temporal: [{ startTimeMs: 1000, endTimeMs: 2000 }],
        resources: [{ resourceName: "CPU", limit: 2, unit: "cores" }],
      },
    };
    visualizer.addNode(constrainedNode);

    const addedNode = visualizer.getNode("Process");
    expect(addedNode).toBeDefined();
    expect(addedNode?.constraints?.temporal).toHaveLength(1);
    expect(addedNode?.constraints?.resources).toHaveLength(1);
  });

  it("should handle updating an existing node's constraints", () => {
    const initialNodes: NodePayload[] = [{ id: "Task1", label: "Task 1" }];
    const visualizer = new ContextualDependencyGraphVisualizer(initialNodes);

    const updatePayload: NodePayload = {
      id: "Task1",
      label: "Task 1 Updated",
      constraints: {
        temporal: [{ startTimeMs: 5000, endTimeMs: 6000 }],
      },
    };
    visualizer.updateNode(updatePayload);

    const updatedNode = visualizer.getNode("Task1");
    expect(updatedNode?.label).toBe("Task 1 Updated");
    expect(updatedNode?.constraints?.temporal).toHaveLength(1);
    expect(updatedNode?.constraints?.resources).toBeUndefined();
  });
});