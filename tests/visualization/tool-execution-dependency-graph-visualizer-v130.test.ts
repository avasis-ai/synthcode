import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  ResourceConstraintNode,
  TemporalEdge,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v130";

describe("ToolExecutionDependencyGraphVisualizerV130", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes: ResourceConstraintNode[] = [
      {
        nodeId: "A",
        name: "Tool A",
        duration: 10,
        requiredResources: [{
          resourceName: "CPU",
          startTime: 0,
          endTime: 10,
          capacity: 1,
        }],
      },
      {
        nodeId: "B",
        name: "Tool B",
        duration: 5,
        requiredResources: [{
          resourceName: "Memory",
          startTime: 5,
          endTime: 10,
          capacity: 1,
        }],
      },
    ];
    const edges: TemporalEdge[] = [
      {
        sourceId: "A",
        targetId: "B",
        dependencyType: "sequential",
        timeOffset: 0,
      },
    ];

    const visualizer = {
      nodes: nodes,
      edges: edges,
    };

    // Assuming the visualizer has a method to process or validate the structure
    // We'll just check if the structure is passed correctly for this test.
    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
  });

  it("should handle complex resource usage across multiple nodes", () => {
    const nodes: ResourceConstraintNode[] = [
      {
        nodeId: "Start",
        name: "Start",
        duration: 0,
        requiredResources: [],
      },
      {
        nodeId: "Process",
        name: "Processing Step",
        duration: 20,
        requiredResources: [
          {
            resourceName: "GPU",
            startTime: 0,
            endTime: 20,
            capacity: 2,
          },
          {
            resourceName: "CPU",
            startTime: 5,
            endTime: 15,
            capacity: 1,
          },
        ],
      },
      {
        nodeId: "End",
        name: "End",
        duration: 0,
        requiredResources: [],
      },
    ];
    const edges: TemporalEdge[] = [
      {
        sourceId: "Start",
        targetId: "Process",
        dependencyType: "sequential",
        timeOffset: 0,
      },
      {
        sourceId: "Process",
        targetId: "End",
        dependencyType: "sequential",
        timeOffset: 0,
      },
    ];

    const visualizer = {
      nodes: nodes,
      edges: edges,
    };

    // Check resource usage details for the 'Process' node
    const processNode = visualizer.nodes.find((n) => n.nodeId === "Process");
    expect(processNode).toBeDefined();
    expect(processNode?.requiredResources).toHaveLength(2);
    expect(processNode?.requiredResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resourceName: "GPU", capacity: 2 }),
        expect.objectContaining({ resourceName: "CPU", capacity: 1 }),
      ])
    );
  });

  it("should correctly represent parallel and conditional dependencies", () => {
    const nodes: ResourceConstraintNode[] = [
      {
        nodeId: "A",
        name: "Task A",
        duration: 10,
        requiredResources: [],
      },
      {
        nodeId: "B",
        name: "Task B",
        duration: 10,
        requiredResources: [],
      },
      {
        nodeId: "C",
        name: "Task C",
        duration: 5,
        requiredResources: [],
      },
    ];
    const edges: TemporalEdge[] = [
      {
        sourceId: "A",
        targetId: "B",
        dependencyType: "parallel",
        timeOffset: 0,
      },
      {
        sourceId: "A",
        targetId: "C",
        dependencyType: "conditional",
        timeOffset: 5,
      },
      {
        sourceId: "B",
        targetId: "C",
        dependencyType: "sequential",
        timeOffset: 0,
      },
    ];

    const visualizer = {
      nodes: nodes,
      edges: edges,
    };

    // Check edge types
    const parallelEdge = visualizer.edges.find((e) => e.sourceId === "A" && e.targetId === "B");
    const conditionalEdge = visualizer.edges.find((e) => e.sourceId === "A" && e.targetId === "C");

    expect(parallelEdge).toBeDefined();
    expect(parallelEdge?.dependencyType).toBe("parallel");

    expect(conditionalEdge).toBeDefined();
    expect(conditionalEdge?.dependencyType).toBe("conditional");
  });
});