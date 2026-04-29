import { describe, it, expect } from "vitest";
import { CapabilityGraphPayload } from "../src/visualization/tool-capability-dependency-graph-visualizer-v149";
import { visualizeDependencyGraph } from "../src/visualization/tool-capability-dependency-graph-visualizer-v149";

describe("visualizeDependencyGraph", () => {
  it("should return a valid structure for an empty graph", () => {
    const payload: CapabilityGraphPayload = {
      toolNodes: [],
      capabilityNodes: [],
      toolToCapabilityLinks: [],
      capabilityDependencies: [],
    };
    const result = visualizeDependencyGraph(payload);
    expect(result).toEqual({
      nodes: [],
      links: [],
    });
  });

  it("should correctly visualize a simple graph with one tool and one capability", () => {
    const payload: CapabilityGraphPayload = {
      toolNodes: [{ id: "tool1", name: "Tool A", description: "Desc A" }],
      capabilityNodes: [{ id: "cap1", name: "Capability X", description: "Desc X" }],
      toolToCapabilityLinks: [{ toolId: "tool1", capabilityId: "cap1" }],
      capabilityDependencies: [],
    };
    const result = visualizeDependencyGraph(payload);
    expect(result.nodes).toHaveLength(2);
    expect(result.links).toHaveLength(1);
  });

  it("should handle multiple tools, capabilities, and dependencies", () => {
    const payload: CapabilityGraphPayload = {
      toolNodes: [
        { id: "tool1", name: "Tool A", description: "Desc A" },
        { id: "tool2", name: "Tool B", description: "Desc B" },
      ],
      capabilityNodes: [
        { id: "cap1", name: "Capability X", description: "Desc X" },
        { id: "cap2", name: "Capability Y", description: "Desc Y" },
      ],
      toolToCapabilityLinks: [
        { toolId: "tool1", capabilityId: "cap1" },
        { toolId: "tool2", capabilityId: "cap2" },
      ],
      capabilityDependencies: [
        { sourceCapabilityId: "cap1", targetCapabilityId: "cap2" },
      ],
    };
    const result = visualizeDependencyGraph(payload);
    expect(result.nodes).toHaveLength(4);
    expect(result.links).toHaveLength(3);
  });
});