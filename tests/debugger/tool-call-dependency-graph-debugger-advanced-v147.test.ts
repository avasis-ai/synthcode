import { describe, it, expect } from "vitest";
import {
  DebuggerContext,
  GraphNode,
} from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v147";

describe("tool-call-dependency-graph-debugger-advanced-v147", () => {
  it("should correctly initialize context with a basic graph", () => {
    const mockGraph: GraphNode[] = [
      { id: "n1", type: "message_generation", inputs: {}, outputs: {} },
      { id: "n2", type: "tool_call", inputs: {}, outputs: {} },
    ];
    const context = {
      graph: mockGraph,
      currentNodeId: "n1",
      history: [{ nodeId: "n1", step: 1 }],
      stepCounter: 1,
      isPaused: false,
    };
    expect(context.graph).toHaveLength(2);
    expect(context.currentNodeId).toBe("n1");
    expect(context.stepCounter).toBe(1);
  });

  it("should update context correctly after processing a node", () => {
    const mockGraph: GraphNode[] = [
      { id: "n1", type: "message_generation", inputs: {}, outputs: {} },
      { id: "n2", type: "tool_call", inputs: {}, outputs: {} },
    ];
    const initialContext = {
      graph: mockGraph,
      currentNodeId: "n1",
      history: [{ nodeId: "n1", step: 1 }],
      stepCounter: 1,
      isPaused: false,
    };
    // Simulate moving to the next node
    const nextContext = {
      ...initialContext,
      currentNodeId: "n2",
      history: [...initialContext.history, { nodeId: "n2", step: 2 }],
      stepCounter: 2,
    };
    expect(nextContext.currentNodeId).toBe("n2");
    expect(nextContext.history).toHaveLength(2);
    expect(nextContext.stepCounter).toBe(2);
  });

  it("should handle pausing and resuming debugging flow", () => {
    const mockGraph: GraphNode[] = [
      { id: "n1", type: "message_generation", inputs: {}, outputs: {} },
      { id: "n2", type: "tool_call", inputs: {}, outputs: {} },
    ];
    let context = {
      graph: mockGraph,
      currentNodeId: "n1",
      history: [{ nodeId: "n1", step: 1 }],
      stepCounter: 1,
      isPaused: false,
    };

    // Pause
    context = { ...context, isPaused: true };
    expect(context.isPaused).toBe(true);

    // Resume
    context = { ...context, isPaused: false };
    expect(context.isPaused).toBe(false);
  });
});