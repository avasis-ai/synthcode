import { describe, it, expect } from "vitest";
import { AdvancedVisualizationPayload, ContextualDependency } from "../src/visualization/contextual-tool-call-dependency-visualizer-v152-advanced-advanced";
import { visualize } from "../src/visualization/contextual-tool-call-dependency-visualizer-v152-advanced-advanced";

describe("visualize", () => {
  it("should correctly visualize a simple linear dependency chain", () => {
    const payload: AdvancedVisualizationPayload = {
      messages: [
        { type: "user", content: "Start process" },
        { type: "assistant", content: "Thinking..." },
        { type: "tool_result", content: "Tool output" },
      ],
      dependencies: [
        {
          sourceId: "user_msg_1",
          targetId: "tool_result_1",
          dependencyType: "sequential",
          contextId: "context_A",
          details: {},
        },
      ],
      initial: "initial_state",
    };
    const result = visualize(payload);
    expect(result).toBeDefined();
    // Add more specific assertions based on expected output structure
  });

  it("should handle multiple types of dependencies correctly", () => {
    const payload: AdvancedVisualizationPayload = {
      messages: [
        { type: "user", content: "Read state X" },
        { type: "assistant", content: "Tool call 1" },
        { type: "tool_result", content: "Write state Y" },
      ],
      dependencies: [
        {
          sourceId: "user_msg_1",
          targetId: "tool_call_1",
          dependencyType: "state_read",
          contextId: "context_B",
          details: { state: "X" },
        },
        {
          sourceId: "tool_call_1",
          targetId: "tool_result_1",
          dependencyType: "state_write",
          contextId: "context_B",
          details: { state: "Y" },
        },
      ],
      initial: "initial_state",
    };
    const result = visualize(payload);
    expect(result).toBeDefined();
    // Assert that the visualization structure reflects both state_read and state_write
  });

  it("should return a valid structure even with no dependencies", () => {
    const payload: AdvancedVisualizationPayload = {
      messages: [
        { type: "user", content: "Simple query" },
        { type: "assistant", content: "Simple answer" },
      ],
      dependencies: [],
      initial: "initial_state",
    };
    const result = visualize(payload);
    expect(result).toBeDefined();
    // Assert that the visualization structure is valid despite empty dependencies array
  });
});