import { describe, it, expect } from "vitest";
import { GraphContext } from "../types";
import { generateGraphContext } from "../graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-fix-v139-new-fix";

describe("generateGraphContext", () => {
  it("should generate a basic graph context from a simple sequence of messages", () => {
    const messages = [
      { type: "user", content: "Start process" },
      { type: "assistant", content: "Process step 1" },
      { type: "user", content: "End process" },
    ];
    const context = generateGraphContext(messages);

    expect(context.nodes).toHaveProperty("start");
    expect(context.nodes).toHaveProperty("process_step_1");
    expect(context.nodes).toHaveProperty("end");
    expect(context.edges).toHaveLength(2);
  });

  it("should handle decision points with conditional edges", () => {
    const messages = [
      { type: "user", content: "Decision point" },
      { type: "assistant", content: "Decision logic" },
    ];
    const context = generateGraphContext(messages);

    const decisionNode = context.nodes["decision_point"];
    expect(decisionNode).toBeDefined();
    expect(decisionNode!.connections).toHaveLength(2);
    expect(decisionNode!.connections[0].condition).toBe("condition_true");
    expect(decisionNode!.connections[1].condition).toBe("condition_false");
  });

  it("should correctly map tool calls and results to graph nodes", () => {
    const messages = [
      { type: "user", content: "Call tool A" },
      { type: "assistant", content: "Tool use A" },
      { type: "tool_result", content: "Result A" },
    ];
    const context = generateGraphContext(messages);

    expect(context.nodes).toHaveProperty("tool_call_a");
    expect(context.nodes).toHaveProperty("tool_result_a");
    expect(context.edges).toContainEqual({
      from: "tool_call_a",
      to: "tool_result_a",
      label: "Success",
    });
  });
});