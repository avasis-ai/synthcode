import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphVisualizerV1 } from "../src/visualization/contextual-dependency-graph-visualizer-v1";

describe("ContextualDependencyGraphVisualizerV1", () => {
  it("should initialize correctly with an empty payload", () => {
    const visualizer = new ContextualDependencyGraphVisualizerV1({
      messages: [],
      dependencies: [],
    });
    expect(visualizer).toBeDefined();
    // Assuming there's a method or property to check initial state,
    // for this example, we just check instantiation.
  });

  it("should correctly process a simple dependency link", () => {
    const payload = {
      messages: [
        { type: "user", content: "Start" }
      ],
      dependencies: [
        {
          sourceId: "user_msg_1",
          targetId: "tool_call_1",
          type: "tool_call",
          contextDiff: null,
        }
      ]
    };
    const visualizer = new ContextualDependencyGraphVisualizerV1(payload);
    // Add a specific assertion based on expected graph structure/output if known
    // For now, we check if the dependency count is correct.
    expect(visualizer.getDependencyCount()).toBe(1);
  });

  it("should handle multiple and different types of dependencies", () => {
    const payload = {
      messages: [
        { type: "user", content: "A" },
        { type: "assistant", content: "B" }
      ],
      dependencies: [
        {
          sourceId: "user_msg_1",
          targetId: "tool_call_1",
          type: "tool_call",
          contextDiff: null,
        },
        {
          sourceId: "tool_call_1",
          targetId: "context_change_2",
          type: "context_change",
          contextDiff: {
            stateKey: "user_prefs",
            oldValue: "dark",
            newValue: "light"
          }
        }
      ]
    };
    const visualizer = new ContextualDependencyGraphVisualizerV1(payload);
    expect(visualizer.getDependencyCount()).toBe(2);
  });
});