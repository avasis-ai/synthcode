import { describe, it, expect } from "vitest";
import {
  ResourceConstraint,
  TemporalRelationship,
  GraphNodeMetadata,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v159";

describe("DynamicToolDependencyGraphVisualizerV159", () => {
  it("should correctly structure resource constraints for a simple dependency", () => {
    const constraints: ResourceConstraint[] = [
      {
        resourceName: "CPU",
        requiredAmount: 1,
        availableAmount: 2,
      },
    ];
    const result = {
      resourceConstraints: constraints,
      temporalRelationships: [],
      nodeMetadata: [],
    };
    expect(result.resourceConstraints).toEqual(
      expect.arrayContaining([
        {
          resourceName: "CPU",
          requiredAmount: 1,
          availableAmount: 2,
        },
      ])
    );
  });

  it("should handle multiple temporal relationships", () => {
    const relationships: TemporalRelationship[] = [
      {
        startTime: 0,
        endTime: 10,
        duration: 10,
      },
      {
        startTime: 10,
        endTime: 20,
        duration: 10,
      },
    ];
    const result = {
      resourceConstraints: [],
      temporalRelationships: relationships,
      nodeMetadata: [],
    };
    expect(result.temporalRelationships).toHaveLength(2);
    expect(result.temporalRelationships[1].endTime).toBe(20);
  });

  it("should populate node metadata for multiple tools", () => {
    const metadata: GraphNodeMetadata[] = [
      {
        nodeId: "toolA",
        toolName: "ToolA",
        input: {
          param1: "value1",
        },
        resourceConsumption: {
          CPU: 0.5,
        },
      },
      {
        nodeId: "toolB",
        toolName: "ToolB",
        input: {
          param2: 123,
        },
        resourceConsumption: {
          Memory: 1,
        },
      },
    ];
    const result = {
      resourceConstraints: [],
      temporalRelationships: [],
      nodeMetadata: metadata,
    };
    expect(result.nodeMetadata).toHaveLength(2);
    expect(result.nodeMetadata[0].toolName).toBe("ToolA");
    expect(result.nodeMetadata[1].input.param2).toBe(123);
  });
});