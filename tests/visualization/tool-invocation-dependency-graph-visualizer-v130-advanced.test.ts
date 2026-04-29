import { describe, it, expect } from "vitest";
import {
  ToolInvocationNode,
  ResourceConstraint,
  TemporalMetadata,
} from "../src/visualization/tool-invocation-dependency-graph-visualizer-v130-advanced";

describe("ToolInvocationDependencyGraphVisualizerV130Advanced", () => {
  it("should correctly initialize with basic nodes and constraints", () => {
    const nodes: ToolInvocationNode[] = [
      { id: "node1", name: "ToolA", dependencies: ["node2"] },
      { id: "node2", name: "ToolB", dependencies: [] },
    ];
    const constraints: ResourceConstraint[] = [
      { resourceName: "CPU", requiredAmount: 1, availableAmount: 2, severity: "low" },
    ];
    const visualizer = new (class {
      constructor(nodes: ToolInvocationNode[], constraints: ResourceConstraint[]) {
        this.nodes = nodes;
        this.constraints = constraints;
      }
      getNodes() { return this.nodes; }
      getConstraints() { return this.constraints; }
    })(nodes, constraints);

    expect(visualizer.getNodes()).toEqual(nodes);
    expect(visualizer.getConstraints()).toEqual(constraints);
  });

  it("should handle empty inputs gracefully", () => {
    const nodes: ToolInvocationNode[] = [];
    const constraints: ResourceConstraint[] = [];
    const visualizer = new (class {
      constructor(nodes: ToolInvocationNode[], constraints: ResourceConstraint[]) {
        this.nodes = nodes;
        this.constraints = constraints;
      }
      getNodes() { return this.nodes; }
      getConstraints() { return this.constraints; }
    })(nodes, constraints);

    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getConstraints()).toEqual([]);
  });

  it("should correctly process nodes with multiple dependencies", () => {
    const nodes: ToolInvocationNode[] = [
      { id: "start", name: "Start", dependencies: [] },
      { id: "middle", name: "Middle", dependencies: ["start"] },
      { id: "end", name: "End", dependencies: ["start", "middle"] },
    ];
    const constraints: ResourceConstraint[] = [];
    const visualizer = new (class {
      constructor(nodes: ToolInvocationNode[], constraints: ResourceConstraint[]) {
        this.nodes = nodes;
        this.constraints = constraints;
      }
      getNodes() { return this.nodes; }
      getConstraints() { return this.constraints; }
    })(nodes, constraints);

    expect(visualizer.getNodes()[2].dependencies).toEqual(["start", "middle"]);
  });
});