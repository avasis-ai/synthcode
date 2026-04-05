import { describe, it, expect } from "vitest";
import { AdvancedVisualizerOptions, GraphContext } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced";
import { renderGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced";

describe("renderGraph", () => {
  it("should render a basic graph with messages", async () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Hello world" },
        { type: "assistant", content: "Hi there!" },
      ],
      to: "mermaid",
    };
    const options: AdvancedVisualizerOptions = { graphTitle: "Basic Chat Graph" };
    const mermaidCode = await renderGraph(context, options);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("Basic Chat Graph");
  });

  it("should render a graph with tool calls and results", async () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "What is the weather?" },
        { type: "assistant", content: "Tool call: get_weather", toolUse: { name: "get_weather", input: { location: "Tokyo" } } },
        { type: "tool_result", content: "{\"temperature\": 25, \"unit\": \"C\"}", toolResult: { name: "get_weather", result: { temperature: 25, unit: "C" } } },
        { type: "assistant", content: "The weather in Tokyo is 25C." },
      ],
      to: "mermaid",
    };
    const options: AdvancedVisualizerOptions = { graphTitle: "Weather Tool Graph" };
    const mermaidCode = await renderGraph(context, options);
    expect(mermaidCode).toContain("get_weather");
    expect(mermaidCode).toContain("Tokyo");
  });

  it("should handle custom node and edge styling", async () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Start" },
        { type: "assistant", content: "Process" },
      ],
      to: "mermaid",
    };
    const options: AdvancedVisualizerOptions = {
      graphTitle: "Styled Graph",
      nodeStyles: (nodeMetadata) => nodeMetadata.type === "user" ? "style fill:#f9f,stroke:#333,stroke-width:2px" : "",
      edgeStyles: (edgeMetadata) => edgeMetadata.source === "user" ? "style stroke:red,stroke-width:2px" : "",
    };
    const mermaidCode = await renderGraph(context, options);
    expect(mermaidCode).toContain("style fill:#f9f,stroke:#333,stroke-width:2px");
    expect(mermaidCode).toContain("style stroke:red,stroke-width:2px");
  });
});