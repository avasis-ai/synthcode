import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphVisualizer } from "../src/visualization/contextual-dependency-graph-visualizer-v153";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with valid payload", () => {
    const payload: any = {
      messages: [{ role: "user", content: "Hello" }],
      dependencies: [{
        sourceContext: "user_input",
        targetContext: "system_prompt",
        description: "Greeting detected",
        strength: 0.8,
      }],
    };
    const visualizer = new ContextualDependencyGraphVisualizer(payload);
    expect(visualizer).toBeDefined();
  });

  it("should calculate the number of dependencies correctly", () => {
    const payload: any = {
      messages: [],
      dependencies: [
        {
          sourceContext: "user_input",
          targetContext: "retrieved_document",
          description: "Doc relevance",
          strength: 0.9,
        },
        {
          sourceContext: "internal_state",
          targetContext: "user_input",
          description: "State change",
          strength: 0.5,
        },
      ],
    };
    const visualizer = new ContextualDependencyGraphVisualizer(payload);
    expect(visualizer.getDependencyCount()).toBe(2);
  });

  it("should return an empty graph structure when no dependencies are present", () => {
    const payload: any = {
      messages: [{ role: "system", content: "System message" }],
      dependencies: [],
    };
    const visualizer = new ContextualDependencyGraphVisualizer(payload);
    expect(visualizer.getDependencyCount()).toBe(0);
    expect(visualizer.getGraphData()).toEqual({
      nodes: [],
      edges: [],
    });
  });
});