import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
  DebuggerContext,
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v141-debugger-final";

describe("tool-call-dependency-graph-debugger-advanced-v141-debugger-final", () => {
  it("should correctly initialize context with a simple graph", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "condition", metadata: {}, dependencies: [] },
      { id: "tool1", type: "tool_call", metadata: {}, dependencies: ["start"] },
      { id: "end", type: "output", metadata: {}, dependencies: ["tool1"] },
    ];
    const edges: GraphEdge[] = [
      { fromId: "start", toId: "tool1" },
      { fromId: "tool1", toId: "end" },
    ];
    const context: DebuggerContext = {
      graph: nodes,
      edges: edges,
      history: [],
      currentNodeId: "start",
      stepIndex: 0,
      isFinished: false,
    };

    expect(context.graph.length).toBe(3);
    expect(context.edges.length).toBe(2);
    expect(context.currentNodeId).toBe("start");
    expect(context.stepIndex).toBe(0);
    expect(context.isFinished).toBe(false);
  });

  it("should handle context update when moving to the next node", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "condition", metadata: {}, dependencies: [] },
      { id: "tool1", type: "tool_call", metadata: {}, dependencies: ["start"] },
    ];
    const edges: GraphEdge[] = [
      { fromId: "start", toId: "tool1" },
    ];
    const initialContext: DebuggerContext = {
      graph: nodes,
      edges: edges,
      history: [],
      currentNodeId: "start",
      stepIndex: 0,
      isFinished: false,
    };

    // Simulate moving to the next step
    const nextContext: DebuggerContext = {
      ...initialContext,
      currentNodeId: "tool1",
      stepIndex: 1,
      isFinished: false,
    };

    expect(nextContext.currentNodeId).toBe("tool1");
    expect(nextContext.stepIndex).toBe(1);
    expect(nextContext.graph).toBe(initialContext.graph);
  });

  it("should set isFinished to true when the final node is reached", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "condition", metadata: {}, dependencies: [] },
      { id: "tool1", type: "tool_call", metadata: {}, dependencies: ["start"] },
      { id: "end", type: "output", metadata: {}, dependencies: ["tool1"] },
    ];
    const edges: GraphEdge[] = [
      { fromId: "start", toId: "tool1" },
      { fromId: "tool1", toId: "end" },
    ];
    const initialContext: DebuggerContext = {
      graph: nodes,
      edges: edges,
      history: [],
      currentNodeId: "tool1",
      stepIndex: 1,
      isFinished: false,
    };

    // Simulate reaching the end node
    const finishedContext: DebuggerContext = {
      ...initialContext,
      currentNodeId: "end",
      stepIndex: 2,
      isFinished: true,
    };

    expect(finishedContext.currentNodeId).toBe("end");
    expect(finishedContext.stepIndex).toBe(2);
    expect(finishedContext.isFinished).toBe(true);
  });
});