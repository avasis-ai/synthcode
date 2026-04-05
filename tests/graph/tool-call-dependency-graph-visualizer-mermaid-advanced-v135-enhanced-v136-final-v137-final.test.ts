import { describe, it, expect } from "vitest";
import {
  AdvancedNodeMetadata,
  AdvancedEdgeMetadata,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced-v136-final-v137-final";

describe("AdvancedNodeMetadata and AdvancedEdgeMetadata", () => {
  it("should correctly structure AdvancedNodeMetadata", () => {
    const metadata: AdvancedNodeMetadata = {
      nodeId: "node1",
      description: "Start node",
      metadata: { source: "A" },
      flowControl: {
        type: "conditional",
        exitPoints: ["exit1", "exit2"],
        condition: "success",
      },
    };
    expect(metadata.nodeId).toBe("node1");
    expect(metadata.description).toBe("Start node");
    expect(metadata.metadata).toEqual({ source: "A" });
    expect(metadata.flowControl).toBeDefined();
    expect(metadata.flowControl!.type).toBe("conditional");
  });

  it("should correctly structure AdvancedEdgeMetadata", () => {
    const metadata: AdvancedEdgeMetadata = {
      sourceId: "nodeA",
      targetId: "nodeB",
      label: "Success Path",
      metadata: { weight: 0.5 },
    };
    expect(metadata.sourceId).toBe("nodeA");
    expect(metadata.targetId).toBe("nodeB");
    expect(metadata.label).toBe("Success Path");
    expect(metadata.metadata).toEqual({ weight: 0.5 });
  });

  it("should handle basic metadata structure", () => {
    const node: AdvancedNodeMetadata = {
      nodeId: "simpleNode",
      description: "Simple node",
      metadata: {},
    };
    const edge: AdvancedEdgeMetadata = {
      sourceId: "start",
      targetId: "end",
      label: "Direct",
      metadata: {},
    };
    expect(node.nodeId).toBe("simpleNode");
    expect(edge.sourceId).toBe("start");
  });
});