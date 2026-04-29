import { describe, it, expect } from "vitest";
import { DynamicToolCapabilityGraphVisualizer, CapabilityGraphPayload } from "../src/visualization/dynamic-tool-capability-graph-visualizer";

describe("DynamicToolCapabilityGraphVisualizer", () => {
  it("should initialize correctly with a valid payload", () => {
    const mockPayload: CapabilityGraphPayload = {
      nodes: [
        { id: "A", name: "Node A", description: "Desc A" },
        { id: "B", name: "Node B", description: "Desc B" },
      ],
      edges: [
        { source: "A", target: "B", relationship: "requires", context: "Context 1" },
      ],
    };
    const visualizer = new DynamicToolCapabilityGraphVisualizer(mockPayload);
    // Assuming there's a way to check internal state or a method to verify initialization
    // For this test, we'll just check if the instance is created without error.
    expect(visualizer).toBeDefined();
  });

  it("should handle an empty payload gracefully", () => {
    const emptyPayload: CapabilityGraphPayload = {
      nodes: [],
      edges: [],
    };
    const visualizer = new DynamicToolCapabilityGraphVisualizer(emptyPayload);
    // Add a specific check if the class has a method like 'getGraphData'
    // For now, we ensure it doesn't crash.
    expect(visualizer).toBeDefined();
  });

  it("should correctly process a complex graph structure", () => {
    const mockPayload: CapabilityGraphPayload = {
      nodes: [
        { id: "Tool1", name: "Tool One", description: "Tool 1 Desc" },
        { id: "CapabilityX", name: "Capability X", description: "Cap X Desc" },
        { id: "CapabilityY", name: "Capability Y", description: "Cap Y Desc" },
      ],
      edges: [
        { source: "Tool1", target: "CapabilityX", relationship: "uses", context: "Uses context" },
        { source: "CapabilityX", target: "CapabilityY", relationship: "requires", context: "Requires context" },
      ],
    };
    const visualizer = new DynamicToolCapabilityGraphVisualizer(mockPayload);
    // If the visualizer has a method to return processed data, test that here.
    // e.g., expect(visualizer.getProcessedGraph()).toEqual(expectedStructure);
  });
});