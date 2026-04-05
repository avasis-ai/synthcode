import { describe, it, expect } from "vitest";
import { GraphContextSnapshot } from "../src/debugger/tool-call-dependency-graph-context-snapshot";

describe("GraphContextSnapshot", () => {
  it("should correctly initialize with empty maps and arrays", () => {
    const snapshot: GraphContextSnapshot = {
      nodeStates: new Map(),
      edgeTraversals: [],
      contextVariables: new Map(),
    };
    expect(snapshot.nodeStates).toBeInstanceOf(Map);
    expect(snapshot.edgeTraversals).toEqual([]);
    expect(snapshot.contextVariables).toBeInstanceOf(Map);
  });

  it("should correctly add a node state", () => {
    const snapshot: GraphContextSnapshot = {
      nodeStates: new Map(),
      edgeTraversals: [],
      contextVariables: new Map(),
    };
    const nodeId = "node1";
    const nodeState = {
      nodeId: nodeId,
      input: { key: "value" },
      output: { result: "success" },
      status: "completed",
    };
    (snapshot.nodeStates as any).set(nodeId, nodeState);

    expect(snapshot.nodeStates.get(nodeId)).toEqual(nodeState);
    expect(snapshot.nodeStates.size).toBe(1);
  });

  it("should correctly record an edge traversal", () => {
    const snapshot: GraphContextSnapshot = {
      nodeStates: new Map(),
      edgeTraversals: [],
      contextVariables: new Map(),
    };
    const traversal: any = {
      fromNodeId: "start",
      toNodeId: "end",
      reason: "dependency met",
      timestamp: Date.now(),
    };
    (snapshot.edgeTraversals as any).push(traversal);

    expect(snapshot.edgeTraversals).toHaveLength(1);
    expect(snapshot.edgeTraversals[0]).toEqual(traversal);
  });
});