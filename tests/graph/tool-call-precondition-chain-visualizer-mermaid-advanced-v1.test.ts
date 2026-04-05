import { describe, it, expect } from "vitest";
import { ToolCallPreconditionChainVisualizerMermaidAdvancedV1, PreconditionCheck } from "../src/graph/tool-call-precondition-chain-visualizer-mermaid-advanced-v1";

describe("ToolCallPreconditionChainVisualizerMermaidAdvancedV1", () => {
  it("should generate correct node IDs for simple preconditions", () => {
    const preconditions: PreconditionCheck[] = [
      { name: "Check A", description: "Desc A" },
      { name: "Check B", description: "Desc B" },
    ];
    const visualizer = new ToolCallPreconditionChainVisualizerMermaidAdvancedV1(preconditions);
    expect(visualizer["generateNodeId"]({ name: "Check A", description: "Desc A" })).toBe("P_CHECK_A");
    expect(visualizer["generateNodeId"]({ name: "Check B", description: "Desc B" })).toBe("P_CHECK_B");
  });

  it("should handle names with spaces and special characters correctly", () => {
    const preconditions: PreconditionCheck[] = [
      { name: "Pre Check 1", description: "Desc 1" },
      { name: "Complex Name!", description: "Desc 2" },
    ];
    const visualizer = new ToolCallPreconditionChainVisualizerMermaidAdvancedV1(preconditions);
    expect(visualizer["generateNodeId"]({ name: "Pre Check 1", description: "Desc 1" })).toBe("P_PRE_CHECK_1");
    expect(visualizer["generateNodeId"]({ name: "Complex Name!", description: "Desc 2" })).toBe("P_COMPLEX_NAME!");
  });

  it("should initialize correctly with an empty array", () => {
    const preconditions: PreconditionCheck[] = [];
    const visualizer = new ToolCallPreconditionChainVisualizerMermaidAdvancedV1(preconditions);
    // We can't directly test private fields, but we can check if the constructor runs without error
    // and assume internal state is empty if no other methods are exposed for testing.
    expect(visualizer).toBeInstanceOf(ToolCallPreconditionChainVisualizerMermaidAdvancedV1);
  });
});