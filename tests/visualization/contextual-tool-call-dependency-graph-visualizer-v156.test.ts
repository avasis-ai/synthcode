import { describe, it, expect } from "vitest";
import { DependencyContext } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v156";
import { DependencyGraphVisualizer } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v156";

describe("DependencyGraphVisualizer", () => {
  it("should initialize correctly with an empty context", () => {
    const context: DependencyContext = {
      messageHistory: [],
      toolCallDependencies: [],
      resourceUsage: {},
    };
    const visualizer = new DependencyGraphVisualizer(context);
    expect(visualizer).toBeDefined();
  });

  it("should correctly process a basic dependency context", () => {
    const context: DependencyContext = {
      messageHistory: [
        { type: "user", content: "What is the weather?", id: "user1" },
        { type: "assistant", content: "Calling weather tool...", id: "assistant1" },
      ],
      toolCallDependencies: [
        {
          sourceId: "user1",
          targetId: "assistant1",
          dependencyType: "temporal",
          reason: "User query precedes tool call",
        },
      ],
      resourceUsage: {
        "weather_api": { required: "location", durationMs: 1000 },
      },
    };
    const visualizer = new DependencyGraphVisualizer(context);
    // Assuming the visualizer has a method to check processed dependencies or structure
    // For this test, we'll just check if it can process the structure without error.
    expect(() => visualizer.processContext()).not.toThrow();
  });

  it("should handle complex dependencies including resource usage", () => {
    const context: DependencyContext = {
      messageHistory: [
        { type: "user", content: "Book a flight.", id: "user1" },
        { type: "assistant", content: "Calling flight tool...", id: "assistant1" },
      ],
      toolCallDependencies: [
        {
          sourceId: "user1",
          targetId: "assistant1",
          dependencyType: "resource",
          reason: "Flight booking requires user input",
        },
        {
          sourceId: "assistant1",
          targetId: "tool_result_1",
          dependencyType: "capability",
          reason: "Tool result informs next step",
        },
      ],
      resourceUsage: {
        "flight_service": { required: "origin", durationMs: 2500 },
        "calendar_service": { required: "date", durationMs: 500 },
      },
    };
    const visualizer = new DependencyGraphVisualizer(context);
    expect(() => visualizer.processContext()).not.toThrow();
  });
});