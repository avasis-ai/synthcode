import { describe, it, expect } from "vitest";
import {
  ContextualToolCallDependencyGraphVisualizerV159AdvancedAdvanced,
  ConstraintSeverity,
  TemporalMetadata,
  ResourceMetadata,
  CapabilityMetadata,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v159-advanced-advanced";

describe("ContextualToolCallDependencyGraphVisualizerV159AdvancedAdvanced", () => {
  it("should correctly initialize with basic data structures", () => {
    const visualizer = new ContextualToolCallDependencyGraphVisualizerV159AdvancedAdvanced();
    expect(visualizer).toBeDefined();
    expect(typeof visualizer.render).toBe("function");
  });

  it("should process a simple dependency graph correctly", () => {
    const mockGraph = {
      nodes: [{ id: "A", type: "tool_call", dependencies: ["B"] }],
      edges: [{ source: "A", target: "B" }],
    };
    const visualizer = new ContextualToolCallDependencyGraphVisualizerV159AdvancedAdvanced();
    const result = visualizer.render(mockGraph);
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("edges");
  });

  it("should handle complex metadata structures when rendering", () => {
    const mockGraph = {
      nodes: [{
        id: "ToolA",
        type: "tool_call",
        metadata: {
          temporal: { startTimeMs: 100, endTimeMs: 200, durationMs: 100 } as TemporalMetadata,
          resource: { resourceName: "CPU", requiredUnits: 1, availableUnits: 4 } as ResourceMetadata,
          capability: { capabilityName: "NLP", isRequired: true, level: "basic" } as CapabilityMetadata,
        },
        dependencies: ["ToolB"],
      }],
      edges: [],
    };
    const visualizer = new ContextualToolCallDependencyGraphVisualizerV159AdvancedAdvanced();
    const result = visualizer.render(mockGraph);
    expect(result.nodes[0].metadata.temporal).toEqual({
      startTimeMs: 100,
      endTimeMs: 200,
      durationMs: 100,
    });
  });
});