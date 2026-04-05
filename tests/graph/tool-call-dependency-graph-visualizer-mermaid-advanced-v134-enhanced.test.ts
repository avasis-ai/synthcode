import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, GraphConfig } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic configuration", () => {
    const config: GraphConfig = {
      messages: [
        { role: "user", content: "Hello" }
      ]
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(config);
    // Assuming there's a way to check internal state or behavior, 
    // for this test, we just check instantiation.
    expect(visualizer).toBeDefined();
  });

  it("should handle configuration with conditional edges", () => {
    const config: GraphConfig = {
      messages: [
        { role: "user", content: "What is the weather?" }
      ],
      conditionalEdges: [
        { from: "user_msg", to: "tool_call_1", condition: "weather_api_success" }
      ],
      enableConditionalPathRendering: true
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(config);
    // A more robust test would check the generated Mermaid graph structure, 
    // but based on the provided snippet, we test the setup path.
    expect(visualizer).toBeDefined();
  });

  it("should handle complex configuration with multiple message types and conditional rendering disabled", () => {
    const config: GraphConfig = {
      messages: [
        { role: "user", content: "Plan a trip." },
        { role: "assistant", content: "I need more info." }
      ],
      conditionalEdges: [
        { from: "user_msg", to: "tool_call_1", condition: "info_needed" }
      ],
      enableConditionalPathRendering: false
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(config);
    expect(visualizer).toBeDefined();
  });
});