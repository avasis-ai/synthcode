import { describe, it, expect } from "vitest";
import { AdvancedGraphOptions } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v38";

describe("AdvancedGraphOptions", () => {
  it("should correctly initialize with empty arrays for metadata", () => {
    const options: AdvancedGraphOptions = {};
    expect(options).toHaveProperty("loopMetadata");
    expect(options.loopMetadata).toEqual([]);
    expect(options).toHaveProperty("conditionalMetadata");
    expect(options.conditionalMetadata).toEqual([]);
  });

  it("should correctly merge loop metadata", () => {
    const loopMetadata = [
      { sourceNodeId: "A", targetNodeId: "B", label: "Loop 1" },
      { sourceNodeId: "C", targetNodeId: "D", label: "Loop 2" },
    ];
    const options: AdvancedGraphOptions = { loopMetadata };
    expect(options.loopMetadata).toEqual(loopMetadata);
  });

  it("should correctly merge conditional metadata", () => {
    const conditionalMetadata = [
      { sourceNodeId: "Start", condition: "Success", targetNodeId: "End" },
      { sourceNodeId: "Process", condition: "Failure", targetNodeId: "Retry" },
    ];
    const options: AdvancedGraphOptions = { conditionalMetadata };
    expect(options.conditionalMetadata).toEqual(conditionalMetadata);
  });
});