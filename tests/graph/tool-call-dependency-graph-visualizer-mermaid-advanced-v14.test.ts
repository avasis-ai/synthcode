import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV14 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v14";
import { Message, AdvancedGraphOptions } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV14", () => {
  it("should generate a basic graph structure for simple message flow", () => {
    const messages: Message[] = [
      { role: "user", content: { type: "text", text: "Hello world" } },
      { role: "assistant", content: { type: "text", text: "Hi there!" } },
    ];
    const options: AdvancedGraphOptions = {
      direction: "TD",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV14();
    const mermaidCode = visualizer.generateGraph(messages, options);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user_node[User Message]");
    expect(mermaidCode).toContain("assistant_node[Assistant Message]");
  });

  it("should correctly include tool calls and dependencies when present", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: {
          type: "tool_use",
          tool_use: {
            tool_name: "search",
            tool_input: "vitest",
          },
        },
      },
      {
        role: "assistant",
        content: {
          type: "tool_use",
          tool_use: {
            tool_name: "search",
            tool_input: "vitest",
          },
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "The search results were useful.",
        },
      },
    ];
    const options: AdvancedGraphOptions = {
      direction: "LR",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV14();
    const mermaidCode = visualizer.generateGraph(messages, options);

    expect(mermaidCode).toContain("search_user_node");
    expect(mermaidCode).toContain("search_assistant_node");
    expect(mermaidCode).toContain("search_user_node -->|Dependency| text_user_node");
  });

  it("should apply custom styling when options are provided", () => {
    const messages: Message[] = [
      { role: "user", content: { type: "text", text: "Start" } },
    ];
    const options: AdvancedGraphOptions = {
      nodeStyle: {
        default: "fill:#f9f,stroke:#333,stroke-width:2px",
        toolUse: "fill:#ccf,stroke:#333,stroke-width:2px",
        thinking: "fill:#ffc,stroke:#333,stroke-width:2px",
        message: "fill:#ddf,stroke:#333,stroke-width:2px",
      },
      linkStyle: {
        default: "stroke:#aaa",
        dependency: "stroke:red,stroke-width:2px",
      }
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV14();
    const mermaidCode = visualizer.generateGraph(messages, options);

    expect(mermaidCode).toContain("style default fill:#f9f,stroke:#333,stroke-width:2px");
    expect(mermaidCode).toContain("linkStyle default stroke:#aaa");
    expect(mermaidCode).toContain("linkStyle dependency stroke:red,stroke-width:2px");
  });
});