import { describe, it, expect } from "vitest";
import { GraphStateSnapshot } from "../src/debugger/tool-call-dependency-graph-state-snapshot";

describe("GraphStateSnapshot", () => {
  it("should initialize with an empty map for nodes", () => {
    const snapshot: GraphStateSnapshot = { nodes: new Map<string, any>() };
    expect(snapshot.nodes).toBeInstanceOf(Map);
    expect(snapshot.nodes.size).toBe(0);
  });

  it("should correctly add a node to the snapshot", () => {
    const snapshot: GraphStateSnapshot = { nodes: new Map<string, any>() };
    const nodeId = "node-1";
    const nodeState = {
      nodeId: nodeId,
      status: "pending",
      input: { param1: "value1" },
      output: {},
      history: [],
    };
    snapshot.nodes.set(nodeId, nodeState);

    expect(snapshot.nodes.has(nodeId)).toBe(true);
    expect(snapshot.nodes.get(nodeId)).toEqual(nodeState);
  });

  it("should handle updates to an existing node's state", () => {
    const snapshot: GraphStateSnapshot = { nodes: new Map<string, any>() };
    const nodeId = "node-2";
    const initialNodeState = {
      nodeId: nodeId,
      status: "pending",
      input: {},
      output: {},
      history: [],
    };
    snapshot.nodes.set(nodeId, initialNodeState);

    const updatedNodeState = {
      nodeId: nodeId,
      status: "completed",
      input: { param1: "value1" },
      output: { result: "success" },
      history: [{ type: "message", content: "Done" }],
    };
    snapshot.nodes.set(nodeId, updatedNodeState);

    expect(snapshot.nodes.get(nodeId)).toEqual(updatedNodeState);
    expect(snapshot.nodes.size).toBe(1);
  });
});