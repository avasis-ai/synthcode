import { describe, it, expect } from "vitest";
import {
  NodeMetadata,
  EdgeMetadata,
  GraphNodeId,
  GraphEdgeId,
} from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v141";

describe("ToolCallDependencyGraphDebuggerAdvancedV141", () => {
  it("should correctly initialize node metadata with basic structure", () => {
    const nodeId: GraphNodeId = "node1";
    const metadata: NodeMetadata = {
      nodeId: nodeId,
      type: "user",
      inputs: {
        prompt: "Hello",
      },
      outputs: {
        response: "Hi there",
      },
      executionResult: null,
      timestamp: 1678886400000,
    };
    expect(metadata.nodeId).toBe(nodeId);
    expect(metadata.type).toBe("user");
    expect(typeof metadata.inputs).toBe("object");
    expect(typeof metadata.outputs).toBe("object");
    expect(typeof metadata.executionResult).toBe("object");
    expect(typeof metadata.timestamp).toBe("number");
  });

  it("should correctly structure edge metadata", () => {
    const edgeId: GraphEdgeId = "edge1";
    const metadata: EdgeMetadata = {
      edgeId: edgeId,
    };
    expect(metadata.edgeId).toBe(edgeId);
  });

  it("should handle empty or default metadata states", () => {
    const emptyNode: NodeMetadata = {
      nodeId: "empty_node",
      type: "internal",
      inputs: {},
      outputs: {},
      executionResult: undefined,
      timestamp: 0,
    };
    const emptyEdge: EdgeMetadata = {
      edgeId: "empty_edge",
    };
    expect(emptyNode.nodeId).toBe("empty_node");
    expect(Object.keys(emptyNode.inputs).length).toBe(0);
    expect(emptyEdge.edgeId).toBe("empty_edge");
  });
});