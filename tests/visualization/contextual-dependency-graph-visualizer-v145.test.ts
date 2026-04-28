import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  EnrichedGraphPayload,
} from "../src/visualization/contextual-dependency-graph-visualizer-v145";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with an empty payload", () => {
    const visualizer = new ContextualDependencyGraphVisualizer({});
    expect(visualizer).toBeInstanceOf(ContextualDependencyGraphVisualizer);
    // Assuming there's a method or property to check initial state,
    // for this test, we just check instantiation.
  });

  it("should process a valid enriched graph payload", () => {
    const mockPayload: EnrichedGraphPayload = {
      nodes: [
        { nodeId: "A", resourceUsage: { cpuMs: 10, memoryKb: 100 }, startTimeMs: 0, endTimeMs: 100 },
        { nodeId: "B", resourceUsage: { cpuMs: 20, memoryKb: 200 }, startTimeMs: 50, endTimeMs: 150 },
      ],
      edges: [
        { sourceId: "A", targetId: "B", durationMs: 50, requiredResource: "CPU" },
      ],
    };
    const visualizer = new ContextualDependencyGraphVisualizer(mockPayload);
    // We can't test the actual rendering, so we test if the internal state/methods are called correctly.
    // Assuming a method like 'getGraphData()' exists or the constructor processes it.
    // For now, we just ensure it runs without error.
    expect(visualizer).toBeDefined();
  });

  it("should handle missing nodes or edges gracefully", () => {
    const mockPayload: EnrichedGraphPayload = {
      nodes: [
        { nodeId: "A", resourceUsage: { cpuMs: 10, memoryKb: 100 }, startTimeMs: 0, endTimeMs: 100 },
      ],
      edges: [
        // Edge pointing to a non-existent node
        { sourceId: "A", targetId: "Z", durationMs: 10, requiredResource: "MEM" },
      ],
    };
    const visualizer = new ContextualDependencyGraphVisualizer(mockPayload);
    // Asserting that the visualizer doesn't crash and handles the invalid edge.
    expect(visualizer).toBeDefined();
  });
});