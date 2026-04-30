import { describe, it, expect } from "vitest";
import { AgentContext, ToolState, GraphState, ResourceUsage } from "../context/contextual-state-snapshotting";

describe("AgentContext", () => {
  it("should initialize with empty messages and history", () => {
    const context: AgentContext = {
      messages: [],
      history: new Map<string, any>(),
    };
    expect(context.messages).toEqual([]);
    expect(context.history.size).toBe(0);
  });
});

describe("ToolState", () => {
  it("should initialize with empty tool outputs and null last tool call ID", () => {
    const state: ToolState = {
      toolOutputs: {},
      lastToolCallId: null,
    };
    expect(state.toolOutputs).toEqual({});
    expect(state.lastToolCallId).toBeNull();
  });
});

describe("GraphState", () => {
  it("should initialize with empty nodes and edges", () => {
    const state: GraphState = {
      nodes: new Map<string, any>(),
      edges: new Set<string>(),
    };
    expect(state.nodes.size).toBe(0);
    expect(state.edges.size).toBe(0);
  });
});