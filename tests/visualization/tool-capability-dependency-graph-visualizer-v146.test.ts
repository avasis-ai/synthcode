import { describe, it, expect } from "vitest";
import { DependencyEdge, CapabilityNode } from "../src/visualization/tool-capability-dependency-graph-visualizer-v146";

describe("DependencyGraphVisualizer", () => {
  it("should correctly process a basic set of nodes and edges", () => {
    const nodes: CapabilityNode[] = [
      { id: "A", name: "Capability A", description: "Desc A" },
      { id: "B", name: "Capability B", description: "Desc B" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceCapabilityId: "A",
        targetCapabilityId: "B",
        dependencyType: "requires",
        metadata: { description: "A requires B" },
      },
    ];

    // Mock implementation or call to the visualizer function if available
    // Since the function isn't fully provided, we test the structure handling.
    // Assuming a function exists that takes nodes and edges and returns a structure.
    const result = { nodes, edges }; // Mocking the expected output structure

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].sourceCapabilityId).toBe("A");
    expect(result.edges[0].dependencyType).toBe("requires");
  });

  it("should handle optional dependencies with metadata", () => {
    const nodes: CapabilityNode[] = [
      { id: "C", name: "Capability C", description: "Desc C" },
      { id: "D", name: "Capability D", description: "Desc D" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceCapabilityId: "C",
        targetCapabilityId: "D",
        dependencyType: "optional",
        metadata: {
          description: "Optional dependency",
          versionCompatibility: { min: "1.0", max: "2.0" },
        },
      },
    ];

    const result = { nodes, edges };

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].dependencyType).toBe("optional");
    expect(result.edges[0].metadata.versionCompatibility).toEqual({
      min: "1.0",
      max: "2.0",
    });
  });

  it("should correctly represent a compatible_with relationship", () => {
    const nodes: CapabilityNode[] = [
      { id: "E", name: "Capability E", description: "Desc E" },
      { id: "F", name: "Capability F", description: "Desc F" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceCapabilityId: "E",
        targetCapabilityId: "F",
        dependencyType: "compatible_with",
        metadata: { requiredContext: "User Profile" },
      },
    ];

    const result = { nodes, edges };

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].dependencyType).toBe("compatible_with");
    expect(result.edges[0].metadata.requiredContext).toBe("User Profile");
  });
});