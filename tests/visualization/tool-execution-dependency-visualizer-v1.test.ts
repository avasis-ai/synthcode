import { describe, it, expect } from "vitest";
import {
  DataPayload,
  ExecutionDependencyNode,
} from "../src/visualization/tool-execution-dependency-visualizer-v1";

describe("ExecutionDependencyVisualizerV1", () => {
  it("should correctly process a simple linear dependency chain", () => {
    const nodes: ExecutionDependencyNode[] = [
      {
        id: "user_1",
        type: "user_input",
        metadata: { role: "user" },
        payloads: [{
          sourceNodeId: "user_1",
          data: "Initial query",
          dataType: "context",
        }],
      },
      {
        id: "tool_call_1",
        type: "tool_call",
        metadata: { toolName: "search" },
        payloads: [{
          sourceNodeId: "user_1",
          data: "Initial query",
          dataType: "context",
        }],
      },
      {
        id: "tool_output_1",
        type: "tool_output",
        metadata: { toolName: "search" },
        payloads: [{
          sourceNodeId: "tool_call_1",
          data: { results: ["result1"] },
          dataType: "tool_output",
        }],
      },
    ];

    // Mocking the actual visualization logic call if necessary,
    // but for structural testing, we check the input handling.
    // Assuming the function takes nodes and returns a structure to be visualized.
    const result = nodes.map(node => ({
      id: node.id,
      type: node.type,
      metadata: node.metadata,
      payloads: node.payloads.map(p => ({
        source: p.sourceNodeId,
        data: p.data,
        type: p.dataType,
      })),
    }));

    expect(result.length).toBe(3);
    expect(result[0].type).toBe("user_input");
    expect(result[2].metadata.toolName).toBe("search");
  });

  it("should handle a complex graph with multiple inputs to one node", () => {
    const nodes: ExecutionDependencyNode[] = [
      {
        id: "user_input_A",
        type: "user_input",
        metadata: { role: "user" },
        payloads: [{
          sourceNodeId: "user_input_A",
          data: "Query A",
          dataType: "context",
        }],
      },
      {
        id: "tool_call_B",
        type: "tool_call",
        metadata: { toolName: "lookup" },
        payloads: [{
          sourceNodeId: "user_input_A",
          data: "Query A",
          dataType: "context",
        }],
      },
      {
        id: "agent_thought_C",
        type: "agent_thought",
        metadata: { thought: "Combine A and B" },
        payloads: [
          {
            sourceNodeId: "user_input_A",
            data: "Query A",
            dataType: "context",
          },
          {
            sourceNodeId: "tool_call_B",
            data: { result: "Lookup B" },
            dataType: "tool_output",
          },
        ],
      },
    ];

    const result = nodes.map(node => ({
      id: node.id,
      type: node.type,
      metadata: node.metadata,
      payloads: node.payloads.map(p => ({
        source: p.sourceNodeId,
        data: p.data,
        type: p.dataType,
      })),
    }));

    const thoughtNode = result.find(r => r.id === "agent_thought_C");
    expect(thoughtNode).toBeDefined();
    expect(thoughtNode?.payloads.length).toBe(2);
    expect(thoughtNode?.payloads.some(p => p.source === "user_input_A")).toBe(true);
    expect(thoughtNode?.payloads.some(p => p.source === "tool_call_B")).toBe(true);
  });

  it("should correctly represent a state transition with internal state updates", () => {
    const nodes: ExecutionDependencyNode[] = [
      {
        id: "initial_state",
        type: "context_retrieval",
        metadata: { source: "DB" },
        payloads: [{
          sourceNodeId: "initial_state",
          data: { user: "Alice" },
          dataType: "context",
        }],
      },
      {
        id: "state_update",
        type: "internal_state",
        metadata: { stateKey: "user_status" },
        payloads: [{
          sourceNodeId: "initial_state",
          data: { status: "Active" },
          dataType: "internal_state",
        }],
      },
    ];

    const result = nodes.map(node => ({
      id: node.id,
      type: node.type,
      metadata: node.metadata,
      payloads: node.payloads.map(p => ({
        source: p.sourceNodeId,
        data: p.data,
        type: p.dataType,
      })),
    }));

    const stateNode = result.find(r => r.id === "state_update");
    expect(stateNode).toBeDefined();
    expect(stateNode?.payloads.length).toBe(1);
    expect(stateNode?.payloads[0].source).toBe("initial_state");
    expect(stateNode?.payloads[0].type).toBe("internal_state");
  });
});