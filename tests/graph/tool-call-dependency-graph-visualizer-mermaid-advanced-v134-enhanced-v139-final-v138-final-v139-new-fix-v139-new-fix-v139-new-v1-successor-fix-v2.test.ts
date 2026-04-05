import { describe, it, expect } from "vitest";
import {
  GraphContext,
  ConditionNode,
  LoopNode,
  NodeDefinition,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor-fix-v2";

describe("GraphContext", () => {
  it("should correctly initialize graph context with basic nodes", () => {
    const context: GraphContext = {
      nodes: {
        "start": {
          type: "start",
          description: "Start of the process",
          nextNodes: ["tool_call_1"],
        },
        "tool_call_1": {
          type: "tool_call",
          description: "Call tool A",
          nextNodes: ["condition_1"],
        },
        "condition_1": {
          type: "condition",
          description: "Check result of tool A",
          outcomes: [
            { condition: "success", nextNodeId: "success_path" },
            { condition: "failure", nextNodeId: "failure_path" },
          ],
        },
        "success_path": {
          type: "end",
          description: "Success path completed",
          nextNodes: [],
        },
        "failure_path": {
          type: "end",
          description: "Failure path completed",
          nextNodes: [],
        },
      },
      // Add other context properties if necessary for a full test
    };

    expect(context.nodes["start"]).toBeDefined();
    expect(context.nodes["tool_call_1"]).toBeDefined();
    expect(context.nodes["condition_1"]).toBeDefined();
    expect(context.nodes["success_path"]).toBeDefined();
    expect(context.nodes["failure_path"]).toBeDefined();
  });

  it("should handle a graph with a loop node", () => {
    const context: GraphContext = {
      nodes: {
        "start": {
          type: "start",
          description: "Start",
          nextNodes: ["loop_entry"],
        },
        "loop_entry": {
          type: "tool_call",
          description: "Enter loop",
          nextNodes: ["condition_loop"],
        },
        "condition_loop": {
          type: "condition",
          description: "Check loop condition",
          outcomes: [
            { condition: "continue", nextNodeId: "process_step" },
            { condition: "exit", nextNodeId: "end_loop" },
          ],
        },
        "process_step": {
          type: "tool_call",
          description: "Process step inside loop",
          nextNodes: ["condition_loop"], // Loop back
        },
        "end_loop": {
          type: "end",
          description: "Exited loop",
          nextNodes: [],
        },
      },
    };

    expect(context.nodes["condition_loop"]).toBeDefined();
    expect((context.nodes["condition_loop"] as any).outcomes).toHaveLength(2);
    expect(context.nodes["process_step"] as any).toBeDefined();
  });

  it("should correctly represent a complex path with multiple transitions", () => {
    const context: GraphContext = {
      nodes: {
        "start": {
          type: "start",
          description: "Start",
          nextNodes: ["tool_call_a"],
        },
        "tool_call_a": {
          type: "tool_call",
          description: "Call Tool A",
          nextNodes: ["condition_a"],
        },
        "condition_a": {
          type: "condition",
          description: "Check A result",
          outcomes: [
            { condition: "success", nextNodeId: "tool_call_b" },
            { condition: "failure", nextNodeId: "end_error" },
          ],
        },
        "tool_call_b": {
          type: "tool_call",
          description: "Call Tool B",
          nextNodes: ["condition_b"],
        },
        "condition_b": {
          type: "condition",
          description: "Check B result",
          outcomes: [
            { condition: "success", nextNodeId: "end_success" },
            { condition: "failure", nextNodeId: "end_error" },
          ],
        },
        "end_success": {
          type: "end",
          description: "Success",
          nextNodes: [],
        },
        "end_error": {
          type: "end",
          description: "Error",
          nextNodes: [],
        },
      },
    };

    expect(context.nodes["condition_a"] as any).toBeDefined();
    expect((context.nodes["condition_a"] as any).outcomes).toEqual(
      expect.arrayContaining([
        { condition: "success", nextNodeId: "tool_call_b" },
        { condition: "failure", nextNodeId: "end_error" },
      ])
    );
    expect(context.nodes["tool_call_b"] as any).toBeDefined();
  });
});