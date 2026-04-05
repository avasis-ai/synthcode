import { describe, it, expect } from "vitest";
import { GraphStateSnapshot } from "../debugger/tool-call-dependency-graph-debugger-advanced-v141-debugger.types";
import { GraphStateSnapshotBuilder } from "../debugger/tool-call-dependency-graph-debugger-advanced-v141-debugger";

describe("GraphStateSnapshotBuilder", () => {
  it("should initialize with empty maps and correct initial state", () => {
    const builder = new GraphStateSnapshotBuilder();
    expect(builder.getState().nodes.size).toBe(0);
    expect(builder.getState().edges.size).toBe(0);
    expect(builder.getState().executionOrder).toEqual([]);
    expect(builder.getState().currentState).toBe("ready");
  });

  it("should add a node and update the state correctly", () => {
    const builder = new GraphStateSnapshotBuilder();
    const nodeId = "node1";
    const nodeData = {
      id: nodeId,
      type: "tool_call",
      metadata: { toolName: "search" },
      input: { query: "test" },
    };
    builder.addNode(nodeId, nodeData);

    const state = builder.getState();
    expect(state.nodes.has(nodeId)).toBe(true);
    expect(state.nodes.get(nodeId)!.type).toBe("tool_call");
    expect(state.nodes.get(nodeId)!.input).toEqual({ query: "test" });
  });

  it("should add an edge between two existing nodes", () => {
    const builder = new GraphStateSnapshotBuilder();
    const sourceId = "source";
    const targetId = "target";

    // Add source and target nodes first
    builder.addNode(sourceId, {
      id: sourceId,
      type: "manual",
      metadata: {},
      input: {},
    });
    builder.addNode(targetId, {
      id: targetId,
      type: "tool_result",
      metadata: {},
      input: {},
    });

    // Add the edge
    const edgeMetadata = { dependency: "requires_output" };
    builder.addEdge(sourceId, targetId, edgeMetadata);

    const state = builder.getState();
    expect(state.edges.has("source->target")).toBe(true);
    expect(state.edges.get("source->target")!.metadata).toEqual(edgeMetadata);
  });
});