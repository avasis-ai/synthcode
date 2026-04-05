import { describe, it, expect } from "vitest";
import { GraphContext } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v3";
import { visualizeDependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v3";

describe("visualizeDependencyGraph", () => {
  it("should generate a basic graph structure for a simple tool call sequence", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "What is the weather in London?" }
      ],
      nodes: new Map([
        ["user_input", { id: "user_input", label: "User Query", type: "user" }],
        ["tool_call_weather", { id: "tool_call_weather", label: "WeatherTool", type: "assistant" }],
        ["tool_result_weather", { id: "tool_result_weather", label: "Weather Result", type: "tool" }],
      ]),
      edges: [
        { from: "user_input", to: "tool_call_weather", type: "call", label: "Calls" },
        { from: "tool_call_weather", to: "tool_result_weather", type: "response", label: "Returns" },
      ]
    };

    const mermaidGraph = visualizeDependencyGraph(context);
    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("user_input --> tool_call_weather");
    expect(mermaidGraph).toContain("tool_call_weather --> tool_result_weather");
  });

  it("should handle multiple tool calls with dependencies", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Get user details and then check their recent orders." }
      ],
      nodes: new Map([
        ["user_input", { id: "user_input", label: "User Query", type: "user" }],
        ["tool_call_details", { id: "tool_call_details", label: "UserDetailsTool", type: "assistant" }],
        ["tool_result_details", { id: "tool_result_details", label: "Details Result", type: "tool" }],
        ["tool_call_orders", { id: "tool_call_orders", label: "OrdersTool", type: "assistant" }],
        ["tool_result_orders", { id: "tool_result_orders", label: "Orders Result", type: "tool" }],
      ]),
      edges: [
        { from: "user_input", to: "tool_call_details", type: "call", label: "Initiates" },
        { from: "tool_call_details", to: "tool_result_details", type: "response", label: "Provides Context" },
        { from: "tool_result_details", to: "tool_call_orders", type: "dependency", label: "Uses Data From" },
        { from: "tool_call_orders", to: "tool_result_orders", type: "response", label: "Completes" },
      ]
    };

    const mermaidGraph = visualizeDependencyGraph(context);
    expect(mermaidGraph).toContain("tool_result_details --> tool_call_orders");
    expect(mermaidGraph).toContain("dependency");
  });

  it("should correctly represent a conditional flow", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Check user status, and if inactive, suggest reactivation." }
      ],
      nodes: new Map([
        ["user_input", { id: "user_input", label: "User Query", type: "user" }],
        ["tool_call_status", { id: "tool_call_status", label: "StatusTool", type: "assistant" }],
        ["tool_result_status", { id: "tool_result_status", label: "Status Result", type: "tool" }],
      ]),
      edges: [
        { from: "user_input", to: "tool_call_status", type: "call", label: "Checks" },
        { from: "tool_call_status", to: "tool_result_status", type: "response", label: "Returns" },
        { from: "tool_result_status", to: "suggest_reactivation", type: "conditional", label: "If Inactive" },
      ]
    };

    const mermaidGraph = visualizeDependencyGraph(context);
    expect(mermaidGraph).toContain("conditional");
    expect(mermaidGraph).toContain("tool_result_status --> suggest_reactivation");
  });
});