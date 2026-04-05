import { describe, it, expect } from "vitest";
import {
  NodeState,
  EdgeTraversal,
} from "../src/debugger/tool-call-dependency-graph-context";

describe("ToolCallDependencyGraphContext", () => {
  it("should correctly initialize a node state", () => {
    const nodeId = "node-1";
    const message: Message = {
      role: "user";
      content: [
        { type: "text", content: "Hello" },
      ],
    };
    const nodeState: NodeState = {
      nodeId: nodeId,
      message: message,
      status: "pending",
      toolCalls: [],
      dependencies: [],
    };
    expect(nodeState.nodeId).toBe(nodeId);
    expect(nodeState.status).toBe("pending");
    expect(nodeState.toolCalls).toEqual([]);
    expect(nodeState.dependencies).toEqual([]);
  });

  it("should correctly represent a node with dependencies", () => {
    const nodeState: NodeState = {
      nodeId: "node-2",
      message: {
        role: "assistant";
        content: [
          { type: "text", content: "Response" },
        ],
      ],
      status: "completed",
      toolCalls: [
        {
          toolName: "tool-a",
          toolInputs: {
            input1: "value",
          },
        },
      ],
      dependencies: [
        {
          sourceId: "node-1",
          targetId: "node-2",
          edgeType: "input",
        },
        {
          sourceId: "node-3",
          targetId: "node-2",
          edgeType: "dependency",
        },
      ],
    };
    expect(nodeState.dependencies.length).toBe(2);
    expect(nodeState.dependencies[0].edgeType).toBe("input");
    expect(nodeState.dependencies[1].sourceId).toBe("node-3");
  });

  it("should correctly structure an edge traversal record", () => {
    const traversal: EdgeTraversal = {
      fromNodeId: "start-node",
      toNodeId: "end-node",
      timestamp: Date.now(),
      action: "resolve",
    };
    expect(traversal.fromNodeId).toBe("start-node");
    expect(traversal.toNodeId).toBe("end-node");
    expect(traversal.action).toBe("resolve");
    expect(typeof traversal.timestamp).toBe("number");
  });
});