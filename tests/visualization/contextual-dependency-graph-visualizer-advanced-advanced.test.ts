import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizerAdvancedAdvanced,
} from "../src/visualization/contextual-dependency-graph-visualizer-advanced-advanced";

describe("ContextualDependencyGraphVisualizerAdvancedAdvanced", () => {
  it("should initialize correctly with basic data", () => {
    const visualizer = new ContextualDependencyGraphVisualizerAdvancedAdvanced(
      {
        messages: [],
        temporalConstraints: [],
        resourceUsages: [],
        capabilityLinks: [],
      }
    );
    expect(visualizer).toBeDefined();
  });

  it("should correctly process and visualize a single dependency link", () => {
    const visualizer = new ContextualDependencyGraphVisualizerAdvancedAdvanced({
      messages: [],
      temporalConstraints: [],
      resourceUsages: [],
      capabilityLinks: [
        {
          sourceCapability: "A",
          targetCapability: "B",
          confidenceScore: 0.9,
        },
      ],
    });
    // Assuming there's a method or property to check the processed graph structure
    // For this test, we'll check if the internal structure reflects the input link
    const graphData = visualizer.getGraphData(); // Assuming this method exists
    expect(graphData.links).toHaveLength(1);
    expect(graphData.links[0].source).toBe("A");
    expect(graphData.links[0].target).toBe("B");
  });

  it("should handle multiple complex inputs (messages, resources, constraints)", () => {
    const visualizer = new ContextualDependencyGraphVisualizerAdvancedAdvanced({
      messages: [
        { type: "user", content: "Hello" },
        { type: "assistant", content: "Hi there" },
      ],
      temporalConstraints: [
        { start: 100, end: 200, severity: "high" },
      ],
      resourceUsages: [
        { resourceId: "CPU", usageLevel: 0.8, isCritical: true },
      ],
      capabilityLinks: [
        {
          sourceCapability: "A",
          targetCapability: "B",
          confidenceScore: 0.7,
        },
        {
          sourceCapability: "B",
          targetCapability: "C",
          confidenceScore: 0.95,
        },
      ],
    });
    const graphData = visualizer.getGraphData(); // Assuming this method exists
    expect(graphData.nodes).toHaveLength(3); // A, B, C
    expect(graphData.links).toHaveLength(2);
    expect(graphData.constraints).toHaveLength(1);
  });
});